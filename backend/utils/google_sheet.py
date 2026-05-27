import requests
import logging

# This is the exact Web App URL you just generated!
APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzpqM_Sf7MYg0p1LBUdIKrasM8XMxcGIfGQBXxWnMMzoZarCfM35Hb045qthcp2UCBBhg/exec"

def append_appointment_to_sheet(appointment_data: dict) -> bool:
    """
    Sends the appointment details straight to Google Sheets 
    via your new Apps Script web app bypass.
    """
    try:
        logging.info("Sending appointment data to Google Sheets...")
        response = requests.post(
            APPS_SCRIPT_URL,
            json=appointment_data,
            timeout=10
        )
        
        # Check if the web app received it successfully
        if response.status_code == 200 and response.json().get("status") == "success":
            logging.info("🚀 Success! Row successfully added to your Google Sheet.")
            return True
        else:
            logging.error(f"❌ Failed to append row. Google Apps Script response: {response.text}")
            return False
            
    except Exception as e:
        logging.error(f"❌ Error connecting to the Google Sheets endpoint: {str(e)}")
        return False
