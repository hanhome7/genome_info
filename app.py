from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI(title="Genome Info")

base_dir = os.path.dirname(os.path.abspath(__file__))

@app.get("/")
def read_root():
    return FileResponse(os.path.join(base_dir, "index.html"))

app.mount("/static", StaticFiles(directory=os.path.join(base_dir, "static")), name="static")
