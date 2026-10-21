"""Minimal headless-Chrome driver over the DevTools protocol, stdlib only
(used by scripts/prerender.py).

    from cdp import Browser
    with Browser() as b:
        p = b.page(1440, 900)
        p.go("https://example.com", wait=4)
        p.shot("out.png")                 # viewport
        p.scroll(900); p.shot("out2.png")
        print(p.js("document.title"))
"""
import base64, json, os, shutil, socket, struct, subprocess, tempfile, time, urllib.request

def _chrome():
    """Chrome (or Edge) on this computer."""
    local = os.environ.get("LOCALAPPDATA", "")
    for p in (r"C:\Program Files\Google\Chrome\Application\chrome.exe",
              r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
              os.path.join(local, r"Google\Chrome\Application\chrome.exe"),
              r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"):
        if p and os.path.exists(p):
            return p
    return shutil.which("chrome") or shutil.which("google-chrome") or shutil.which("chromium")


CHROME = _chrome()


class _WS:
    def __init__(self, url):
        rest = url.split("://", 1)[1]
        hostport, path = rest.split("/", 1)
        host, port = hostport.split(":")
        self.s = socket.create_connection((host, int(port)), timeout=120)
        key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall((f"GET /{path} HTTP/1.1\r\nHost: {hostport}\r\nUpgrade: websocket\r\n"
                        f"Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n").encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.s.recv(4096)
        head, rest = buf.split(b"\r\n\r\n", 1)
        if b" 101 " not in head.split(b"\r\n")[0]:
            raise RuntimeError(head.decode(errors="replace"))
        self.buf = bytearray(rest)

    def send(self, text):
        data = text.encode()
        n = len(data)
        hdr = bytearray([0x81])
        if n < 126:
            hdr.append(0x80 | n)
        elif n < 65536:
            hdr.append(0x80 | 126); hdr += struct.pack(">H", n)
        else:
            hdr.append(0x80 | 127); hdr += struct.pack(">Q", n)
        mask = os.urandom(4)
        hdr += mask
        m = (mask * (n // 4 + 1))[:n]
        self.s.sendall(bytes(hdr) + bytes(a ^ b for a, b in zip(data, m)))

    def _read(self, n):
        while len(self.buf) < n:
            chunk = self.s.recv(1 << 20)
            if not chunk:
                raise EOFError("socket closed")
            self.buf += chunk
        out = bytes(self.buf[:n])
        del self.buf[:n]
        return out

    def recv(self):
        msg = bytearray()
        while True:
            b1, b2 = self._read(2)
            op, n = b1 & 0x0F, b2 & 0x7F
            if n == 126:
                n = struct.unpack(">H", self._read(2))[0]
            elif n == 127:
                n = struct.unpack(">Q", self._read(8))[0]
            if b2 & 0x80:
                self._read(4)
            payload = self._read(n)
            if op in (9, 10):
                continue
            msg += payload
            if b1 & 0x80:
                return msg.decode()


class Page:
    def __init__(self, ws_url, w, h, mobile=False, dpr=1):
        self.ws = _WS(ws_url)
        self.i = 0
        self.w, self.h = w, h
        self.errors = []
        self.call("Page.enable")
        self.call("Runtime.enable")
        self.call("Log.enable")
        self.call("Emulation.setDeviceMetricsOverride", width=w, height=h, deviceScaleFactor=dpr, mobile=mobile)
        if mobile:
            self.call("Emulation.setTouchEmulationEnabled", enabled=True, maxTouchPoints=5)
            self.call("Emulation.setUserAgentOverride", userAgent=(
                "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/130.0 Mobile Safari/537.36"))

    def call(self, method, **params):
        self.i += 1
        my = self.i
        self.ws.send(json.dumps({"id": my, "method": method, "params": params}))
        while True:
            m = json.loads(self.ws.recv())
            if m.get("id") == my:
                if "error" in m:
                    raise RuntimeError(f"{method}: {m['error']}")
                return m.get("result", {})
            ev = m.get("method")
            if ev == "Runtime.exceptionThrown":
                d = m["params"]["exceptionDetails"]
                self.errors.append("EXC " + (d.get("exception", {}).get("description") or d.get("text", ""))[:300])
            elif ev == "Runtime.consoleAPICalled" and m["params"].get("type") in ("error", "warning"):
                self.errors.append(m["params"]["type"].upper() + " " + " ".join(str(a.get("value", a.get("description", ""))) for a in m["params"].get("args", []))[:300])
            elif ev == "Log.entryAdded" and m["params"]["entry"].get("level") == "error":
                e = m["params"]["entry"]
                self.errors.append("LOG " + (e.get("text", "") + " " + e.get("url", ""))[:300])

    def go(self, url, wait=4.0):
        self.call("Page.navigate", url=url)
        time.sleep(wait)
        return self

    def js(self, expr):
        r = self.call("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
        if "exceptionDetails" in r:
            raise RuntimeError(json.dumps(r["exceptionDetails"])[:600])
        return r.get("result", {}).get("value")

    def scroll(self, y, wait=1.2):
        self.js(f"window.scrollTo({{top:{y},left:0,behavior:'instant'}})")
        time.sleep(wait)

    def wheel(self, dy, steps=6, wait=1.5, x=None, y=None):
        """Scroll the way a person does (works with smooth-scroll libraries)."""
        x = self.w // 2 if x is None else x
        y = self.h // 2 if y is None else y
        self.call("Input.dispatchMouseEvent", type="mouseMoved", x=x, y=y)
        for _ in range(steps):
            self.call("Input.dispatchMouseEvent", type="mouseWheel", x=x, y=y, deltaX=0, deltaY=dy / steps)
            time.sleep(0.08)
        time.sleep(wait)

    def move(self, x, y, wait=0.6):
        self.call("Input.dispatchMouseEvent", type="mouseMoved", x=x, y=y)
        time.sleep(wait)

    def click(self, x, y, wait=1.5):
        for t in ("mousePressed", "mouseReleased"):
            self.call("Input.dispatchMouseEvent", type=t, x=x, y=y, button="left", clickCount=1)
        time.sleep(wait)

    def height(self):
        return self.js("Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0)")

    def shot(self, path, fmt="png", quality=85):
        params = {"format": fmt}
        if fmt == "jpeg":
            params["quality"] = quality
        data = self.call("Page.captureScreenshot", **params)["data"]
        with open(path, "wb") as f:
            f.write(base64.b64decode(data))
        return path


class Browser:
    def __init__(self, port=9333):
        self.port = port
        self.dir = tempfile.mkdtemp(prefix="cdp-")
        self.proc = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={port}",
                                      f"--user-data-dir={self.dir}", "--hide-scrollbars", "--mute-audio",
                                      "--no-first-run", "--no-default-browser-check", "--disable-extensions",
                                      "--force-color-profile=srgb", "about:blank"],
                                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=1).read()
                break
            except Exception:
                time.sleep(0.2)

    def page(self, w=1440, h=900, mobile=False, dpr=1):
        req = urllib.request.Request(f"http://127.0.0.1:{self.port}/json/new?about:blank", method="PUT")
        info = json.loads(urllib.request.urlopen(req, timeout=10).read())
        return Page(info["webSocketDebuggerUrl"], w, h, mobile, dpr)

    def close(self):
        try:
            self.proc.kill()
            self.proc.wait(5)
        except Exception:
            pass
        shutil.rmtree(self.dir, ignore_errors=True)

    def __enter__(self):
        return self

    def __exit__(self, *a):
        self.close()
