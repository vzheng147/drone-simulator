import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

class Mosaic(BaseModel):
  name: str
  location: str
  date: str

class User(BaseModel):
  name: str
  password: str
  mosaics: List[Mosaic]

origins = [
  "http://localhost:3000"
]

app.add_middleware()

