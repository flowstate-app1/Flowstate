import http.server, os
os.chdir('/Users/maggiehelfrich/Downloads/study-app')
http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=8099, bind='')
