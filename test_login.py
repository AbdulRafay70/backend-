import requests

def run():
    # Your local API URL
    url = "http://127.0.0.1:8000/api/token/"

    # Your credentials
    data = {
        "username": "rafay",
        "password": "hyd12233"
    }

    # Send POST request
    response = requests.post(url, json=data)

    # Show full response
    print("Status Code:", response.status_code)
    try:
        print("Response JSON:", response.json())
    except Exception:
        print(response.text)


if __name__ == "__main__":
    run()
