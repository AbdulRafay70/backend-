from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/user/<username>/<email>', methods=['GET'])
def get_user(username,email):
    data = {
        "username": username,
        "email": email,
        "followers": 120,
        "public_repos": 5
    }
    return jsonify(data)

@app.route('/create-user', methods=['POST'])
def create_user():
    body = request.json
    return jsonify({
        "message": "User created successfully!",
        "data_received": body
    })

app.run(debug=True)
