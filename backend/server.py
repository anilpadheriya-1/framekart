@app.get("/api/health")
async def health():
    try:
        # Verify MongoDB connection
        await db.command('ping')
        return {"status": "ok", "database": "connected", "time": datetime.utcnow().isoformat()}
    except Exception as e:
        raise HTTPException(503, {"status": "error", "message": "Database connection failed"})