import os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from http.server import HTTPServer, SimpleHTTPRequestHandler
print("Servidor iniciado en http://localhost:3000")
HTTPServer(('', 3000), SimpleHTTPRequestHandler).serve_forever()
