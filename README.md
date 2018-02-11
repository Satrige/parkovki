# Сервис календаря рабочих дней

Сервис предоставляет REST API, который позволяет вести календарь рабочих дней сотрудников.

Полная документация API: https://app.swaggerhub.com/apis/Satrige/parkovki/0.0.1#

Для работы сервиса нужен работающий инстанс монги. Для инициализации нужно прокинуть переменные окружения
DB_HOST,DB_PORT, DB_NAME. Либо напрямую изменить эти значения в файле config.js. 

## Примеры использования сервиса

### Добавление нового юзера в базу

curl -X POST \
  http://localhost:3000/users \
  -H 'content-type: application/json' \
  -d '{
	"name": "first",
	"email": "test1@test.test",
	"phone": "1234",
	"note": "blah-blah"
}'

### Обновление существующего пользователя в базе

curl -X PUT \
  http://localhost:3000/users/5a7b21b5fac81035ec1ab3d7 \
  -H 'content-type: application/json' \
  -d '{
	"phone": "12"
}'

### Удаление существующего пользователя из базы

curl -X DELETE \
  http://localhost:3000/users/5a7b21b5fac81035ec1ab3d7 \
  -H 'content-type: application/json'
  
### Получение пользователя из базы 

По id:

curl -X GET   http://localhost:3000/users/5a7fff827d1d856a14a35e29

По email:

curl -X GET   http://localhost:3000/users/?email=test1@test.test

### Загрузка файла с информацией о рабочих днях пользователей

curl -i -X POST -H "Content-Type: multipart/form-data"  -F "file=@workdays-testdata.json" http://127.0.0.1:3000/calendar/upload

В сервисе реализована проверка на то, что пользователь с email'ом, указанным в записи, обязательно должен существовать в базе.
По умолчанию, она отключена. Для того, чтобы ее включить нужно добавить query-параметр check=true


