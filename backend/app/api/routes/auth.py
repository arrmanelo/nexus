from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.core.supabase import supabase

router = APIRouter()

class AuthRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
async def register(body: AuthRequest):
    try:
        res = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
        })
        if res.user is None:
            raise HTTPException(status_code=400, detail="Ошибка регистрации")
        return {"message": "Аккаунт создан", "user_id": res.user.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(body: AuthRequest):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
        # Логируем что вернул Supabase
        print("SESSION:", res.session)
        print("USER:", res.user)

        if res.user is None:
            raise HTTPException(status_code=401, detail="Неверный email или пароль")

        return {
            "access_token": res.session.access_token,
            "token_type": "bearer",
            "user_id": res.user.id,
            "email": res.user.email,
        }
    except HTTPException:
        raise
    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=401, detail=str(e))