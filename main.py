from flask import Flask, request, jsonify
from tasks import process_image
import logging

app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.INFO)


@app.route('/', methods=['GET'])
def get_request():
    logging.info('Received GET')
    return 'Hello World! Use POST to trigger the plugin in development.'


@app.route('/', methods=['POST'])
def post_request():
    logging.info('Received POST')
    data = request.json
    pluginInvocationToken = data['pluginInvocationToken']
    assets = data['assets']
    callbackUrl = data['callbackUrl']

    # Process the image to ensure it is under 2MB
    process_image(pluginInvocationToken, assets, callbackUrl)

    return jsonify({'status': 'Processing'}), 200


if __name__ == '__main__':
    port = 3000
    logging.info(
        f'Plugin listening on port {port}.\nUse `ngrok http {port}` to expose this port to the internet for development.'
    )
    app.run(port=port)
