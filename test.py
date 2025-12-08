import requests
response = requests.get("http://127.0.0.1:5000/user/khizar/khizar@example.com")
print(response.json())

import requests

url = "http://127.0.0.1:5000/create-user"
payload = {
    "name": "khizar",
    "email": "khizar@example.com"
}

response = requests.post(url, json=payload)
print(response.json())
