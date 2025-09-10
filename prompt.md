Using this GEMINI API KEY and Model, which can be configurable:
Allow the user to upload a medical order pdf/png/jpg file and 
Using this prompt: 
"Extract the following information from this medical order:
      - Order Number
      - Order Date
      - Clinician Name
      - Clinician ID Type (national, provincial, gpf)
      - Clinician ID Number
      - Diagnosis
      - Notes
      - Requested Services"
Show the user those fields to review along the order and allow download of the info using this JSON:
      {
        "order": {
          "orderNumber": "",
          "orderDate": "",
          "clinicianName": "",
          "clinicianIdType": "",
          "clinicianIdNumber": "",
          "diagnosis": "",
          "notes": "",
          "requestedServices": [

          ]
        }
      }
This solution should run in a github.io page
- Needs to have a usr/pwd to enter (simple but effective)
- Needs to have a disclaimer on not to send real patient / PHI data
- Needs to be in Spanish
