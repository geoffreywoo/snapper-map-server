export PORT=80
export DATA_REALM=azure
forever start -c nodemon -e js,coffee otoro.js
