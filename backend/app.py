# Initialize MTCNN with a smaller min_face_size (Industry Step #4)
# Default is 20, setting it to 15 helps with tiny crowd faces
detector = MTCNN(min_face_size=15)

def apply_pro_preprocessing(img):
    # 1. Lighting Correction (Industry Step #3)
    # Converts to LAB color space to equalize only the brightness (L channel)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.equalizeHist(l)
    img = cv2.merge((l, a, b))
    img = cv2.cvtColor(img, cv2.COLOR_LAB2BGR)

    # 2. Sharpening (Industry Step #3)
    # Makes blurry edges of small faces more defined for the AI
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    img = cv2.filter2D(img, -1, kernel)
    
    return img

@app.route('/api/detect', methods=['POST'])
def detect():
    data = request.get_json()
    raw_image = decode_image(data.get('image', ''))
    if raw_image is None: return jsonify({'error': 'Invalid image'}), 400

    h, w = raw_image.shape[:2]
    
    # Apply the Pro Pre-processing for better clarity
    processed_input = apply_pro_preprocessing(raw_image)
    
    # MTCNN requires RGB
    rgb_img = cv2.cvtColor(processed_input, cv2.COLOR_BGR2RGB)
    
    # Detect faces
    results = detector.detect_faces(rgb_img)
    
    output_image = raw_image.copy() # Draw on the original sharp image
    
    # Industry Step #6: Interpolation-aware scaling for labels
    thickness = max(1, int(max(h, w) / 450))
    font_scale = max(0.35, max(h, w) / 1300.0)

    confidences = []
    for res in results:
        conf = res['confidence']
        # Lowered threshold to catch distant targets
        if conf > 0.35: 
            x, y, width, height = res['box']
            
            # Ensure coordinates stay within image bounds
            x, y = max(0, x), max(0, y)
            
            # Draw detection (Step #5 logic: box only)
            cv2.rectangle(output_image, (x, y), (x + width, y + height), (0, 255, 0), thickness)
            
            label = f"{int(conf*100)}%"
            cv2.putText(output_image, label, (x, y-10 if y-10 > 10 else y+20),
                        cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 255, 0), thickness, cv2.LINE_AA)
            confidences.append(float(conf))

    return jsonify({
        'faces': len(confidences),
        'confidence': confidences,
        'processedImage': encode_image(output_image)
    })