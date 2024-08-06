import requests
from PIL import Image, ImageDraw, ImageFont
import io
import logging
from collections import Counter
import numpy as np


def process_image(pluginInvocationToken, assets, callbackUrl):
    logging.info('Invoking process_image plugin %s', pluginInvocationToken)

    status = "success"
    asset = assets[0]
    url = asset['url']
    title = asset['title']

    try:
        # Download the input image
        input_image_response = requests.get(url)
        input_image = Image.open(io.BytesIO(input_image_response.content))
        logging.info('Loaded input asset')

        # Extract color palette
        palette = extract_palette(input_image)
        logging.info('Extracted palette %s', palette)

        # Create a new image with the color palette and hex codes
        output_image = create_palette_image(palette)
        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format='PNG')
        logging.info('Created output image with color palette')

        # Create a placeholder asset to upload the result to
        create_assets_response = requests.post(
            callbackUrl,
            json={
                'pluginInvocationToken':
                pluginInvocationToken,
                'operation':
                'createAssets',
                'assets': [{
                    'title': f"{title} - color palette",
                    'mediaType': "image/png",
                }]
            })

        created_assets = create_assets_response.json()['assets']
        upload_url = created_assets[0]['uploadUrl']

        # Upload the processed image
        requests.put(upload_url,
                     headers={'Content-Type': 'image/png'},
                     data=output_buffer.getvalue())
        logging.info('Uploaded to Playbook')
    except Exception as e:
        status = "failed"
        logging.error(e)

    # Update the status
    requests.post(callbackUrl,
                  json={
                      'pluginInvocationToken': pluginInvocationToken,
                      'status': status,
                  })

    logging.info('Finished')


def extract_palette(image, num_colors=20, similarity_threshold=30):
    """Extract a diverse color palette from the image, including less frequent but vibrant colors."""
    image = image.convert('RGB')
    image = image.resize((image.width // 10, image.height // 10))
    pixels = list(image.getdata())
    palette = Counter(pixels).most_common()

    # Use a more sophisticated method to select diverse colors
    selected_palette = []
    for color, _ in palette:
        if not any(
                is_similar(color, other_color, similarity_threshold)
                for other_color in selected_palette):
            selected_palette.append(color)
        if len(selected_palette) >= num_colors:
            break

    return selected_palette


def is_similar(color1, color2, threshold):
    """Check if two colors are similar based on a threshold."""
    return np.linalg.norm(np.array(color1) - np.array(color2)) < threshold


def create_palette_image(palette):
    """Create an image displaying the color palette with hex codes."""
    width, height = 500, 50 * len(palette)  # Increase width for larger text
    palette_image = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(palette_image)

    # Load a better font
    try:
        font = ImageFont.truetype("LiberationMono-Regular.ttf",
                                  30)  # Example font file
    except IOError:
        font = ImageFont.load_default(
        )  # Fallback to default if the font is not available

    for i, color in enumerate(palette):
        draw.rectangle([0, i * 50, width, (i + 1) * 50], fill=color)
        hex_color = '#{:02x}{:02x}{:02x}'.format(*color)
        draw.text((10, i * 50 + 10), hex_color, fill=(0, 0, 0), font=font)

    return palette_image
