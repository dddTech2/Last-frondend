import asyncio
import httpx
import os

# Configuration
API_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin" 
ADMIN_PASSWORD = "password123" 

async def login():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{API_URL}/auth/login/token", data={
                "username": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            if response.status_code != 200:
                print(f"Login failed: {response.status_code} - {response.text}")
                return None
            return response.json()["access_token"]
        except Exception as e:
            print(f"Login error: {e}")
            return None

async def test_silent_update(token):
    print("\n--- Testing Silent Update ---")
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        # 1. Get an existing employee (or create one if needed, but lets try to get one)
        response = await client.get(f"{API_URL}/employees/", headers=headers)
        if response.status_code != 200:
            print(f"Failed to list employees: {response.text}")
            return

        data = response.json()
        employees = data.get("items", []) if isinstance(data, dict) else data
        
        if not employees:
            print("No employees found to test.")
            return

        target_employee = employees[0]
        cedula = target_employee["cedula"]
        print(f"Targeting employee: {target_employee['nombre']} ({cedula})")
        
        # 2. Update with new data
        update_payload = {
            "direccion_residencia": "Calle Falsa 123 - Updated via Script",
            "observaciones_contrato": "Updated silently via script."
        }

        print(f"Sending update to /employees/{cedula}/full...")
        response = await client.put(
            f"{API_URL}/employees/{cedula}/full", 
            json=update_payload, 
            headers=headers
        )

        if response.status_code == 200:
            updated_data = response.json()
            print("Update successful!")
            new_address = updated_data.get('direccion_residencia') or updated_data.get('direccion')
            print(f"New address: {new_address}")
            
            if new_address == update_payload['direccion_residencia']:
                print("SUCCESS: Data persisted.")
            else:
                print("FAILURE: Data did not persist.")
        else:
            print(f"Update failed: {response.status_code} - {response.text}")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    token = loop.run_until_complete(login())
    if token:
        loop.run_until_complete(test_silent_update(token))
