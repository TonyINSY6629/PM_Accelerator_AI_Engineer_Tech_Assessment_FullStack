import requests
from fastapi import FastAPI, HTTPException, Query, Response #to build REST API, used uvicorn to run in browser
from pydantic import BaseModel

from app.db.database import init_db
from app.db import repository
from app.services import lookups
from app.services.validation import ValidationError
from app.services import export as export_service

init_db()

app = FastAPI(title="Weather App API")
@app.get("/api/info") # ----------------------------------------get things via APIs
def get_app_info():
    return {
        "developer": "Tony Wang",
        "developer email": "<tywg18.na@gmail.com>",
        "developer LinkedIn page": "https://www.linkedin.com/in/tonywang-br/",
        "app_name": "Weather App (AI Engineer Tech Assessment - Full Stack)",
        "pm_accelerator": """
        The Product Manager Accelerator Program is designed to support PM professionals through every stage of their careers. 
        From students looking for entry-level jobs to Directors looking to take on a leadership role, our program has helped over hundreds of students fulfill their career aspirations.
        Our Product Manager Accelerator community are ambitious and committed. Through our program they have learnt, honed and developed new PM and leadership skills, giving them a strong foundation for their future endeavors.
        Here are the examples of services we offer:
        🚀 PMA Pro
        End-to-end product manager job hunting program that helps you master FAANG-level Product Management skills, conduct unlimited mock interviews, and gain job referrals through our largest alumni network. 
        25% of our offers came from tier 1 companies and get paid as high as $800K/year. 

        🚀 AI PM Bootcamp
        Gain hands-on AI Product Management skills by building a real-life AI product with a team of AI Engineers, data scientists, and designers. 
        We will also help you launch your product with real user engagement using our 100,000+ PM community and social media channels. 

        🚀 PMA Power Skills
        Designed for existing product managers to sharpen their product management skills, leadership skills, and executive presentation skills

        🚀 PMA Leader
        We help you accelerate your product management career, get promoted to Director and product executive levels, and win in the board room. 

        🚀 1:1 Resume Review
        We help you rewrite your killer product manager resume to stand out from the crowd, with an interview guarantee. 
        Get started by using our FREE killer PM resume template used by over 14,000 product managers. https://www.drnancyli.com/pmresume

        🚀 We also published over 500+ free training and courses. 
        Please go to my YouTube channel https://www.youtube.com/c/drnancyli and Instagram @drnancyli to start learning for free today.""",
    }


@app.post("/api/sessions") # -----------------------------------post and make changes to databases
def start_session():
    session_id = repository.create_session()
    return {"session_id": session_id}


class LookupRequest(BaseModel): # ------------------------------the shape of the request body for lookup
    session_id: int
    raw_query: str
    start_date: str
    end_date: str
    chosen_location: dict | None = None
    notes: str | None = None

@app.post("/api/lookups") # ------------------------------------filled based on the body defined above
def create_lookup(request: LookupRequest):
    try:
        lookup_id = lookups.create_lookup(
            session_id=request.session_id,
            raw_query=request.raw_query,
            start_date=request.start_date,
            end_date=request.end_date,
            chosen_location=request.chosen_location,
            notes=request.notes,
        )
    except ValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Weather service is unavailable.")

    return {"lookup_id": lookup_id}


@app.get("/api/lookups") # --------------------------------------wrapping the resulting list in an object, and FastAPI serializes it to JSON
def get_all_lookups(): # ----------------------------------------allowing users to read any of the weather information they have requested previously
    return {"lookups": repository.list_lookups()}


@app.get("/api/lookups/{lookup_id}") # --------------------------get data of each look up record, variable name in the bracket {} must match with the parameter name below
def get_one_lookup(lookup_id: int): # ---------------------------the parameter defined has to match with the variable name in the bracket {} above
    record = repository.get_lookup(lookup_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"No lookup found with id {lookup_id}.")
    return record


@app.delete("/api/lookups/{lookup_id}") # -----------------------allowing users to delete lookup rows
def delete_one_lookup(lookup_id: int) -> dict:
    was_deleted = repository.delete_lookup(lookup_id)
    if was_deleted is False:
        raise HTTPException(status_code=404, detail=f"No lookup found with id {lookup_id}.")
    return {"deleted": True, "lookup_id": lookup_id}


class LookupUpdateRequest(BaseModel): # -------------------------the shape of the request body for updating a lookup record
    start_date: str
    end_date: str
    notes: str | None = None
    raw_query: str | None = None
    chosen_location: dict | None = None

@app.put("/api/lookups/{lookup_id}") # --------------------------calls the update service, and returns the complete updated record
def update_one_lookup(lookup_id: int, request: LookupUpdateRequest) -> dict:
    try:
        updated_record = lookups.update_lookup(
            lookup_id=lookup_id,
            start_date=request.start_date,
            end_date=request.end_date,
            notes=request.notes,
            raw_query=request.raw_query,
            chosen_location=request.chosen_location,
        )
    except ValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Weather service is unavailable.")

    if updated_record is None:
        raise HTTPException(status_code=404, detail=f"No lookup found with id {lookup_id}.")

    return updated_record

@app.get("/api/lookups/{lookup_id}/export")
def export_one_lookup(
    lookup_id: int,
    session_id: int,
    export_format: str = Query(default="csv", alias="format"),
) -> Response:
    if export_format.lower() != "csv":
        raise HTTPException(status_code=422, detail="Only 'csv' is supported.")

    exported = export_service.export_lookup_to_csv(lookup_id)
    if exported is None:
        raise HTTPException(status_code=404, detail=f"No lookup found with id {lookup_id}.")

    csv_text, row_count = exported
    repository.insert_export_log(session_id, lookup_id, "csv", row_count)

    filename = f"weather_lookup_{lookup_id}.csv"
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )