try:
    with open("test_log.txt", "w") as f:
        f.write("Hello World from Python")
    print("Write Success")
except Exception as e:
    print(f"Write Failed: {e}")
