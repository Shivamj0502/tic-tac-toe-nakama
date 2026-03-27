FROM heroiclabs/nakama:3.20.0

# Railway ke environment variables use karne ke liye script
ENTRYPOINT ["/bin/sh", "-ecx", "/nakama/nakama migrate up --database.address $DATABASE_URL && exec /nakama/nakama --database.address $DATABASE_URL --logger.level DEBUG --socket.port 7350 --socket.address 0.0.0.0"]