from dotenv import load_dotenv

# Load the .env file
load_dotenv()

from backend.orchestrator.graph import run_pipeline

idea = """
Develop an AI-powered smart healthcare platform that connects patients, doctors, hospitals, 
diagnostic labs, pharmacies, and fitness devices into one ecosystem. The platform should allow 
users to book appointments, maintain lifelong digital health records, receive AI-assisted symptom 
analysis, schedule lab tests, order medicines, track chronic diseases like diabetes and 
hypertension, monitor vital signs using wearable devices, and provide personalized diet and
 exercise recommendations. Doctors should have a dedicated dashboard to manage patient history, 
 prescriptions, telemedicine consultations, and AI-assisted diagnosis support. The system should 
 prioritize data privacy, HIPAA-compliant security, emergency response features, and seamless 
 integration with existing hospital management systems.
"""

try:
    result = run_pipeline(idea, use_fallback_on_error=False)
    print(result)

except Exception as e:
    print("ERROR:")
    print(e)
finally:
    print("Hello")