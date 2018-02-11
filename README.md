# Сервис календаря рабочих дней

Сервис предоставляет REST API, который позволяет вести календарь рабочих дней сотрудников.

В работе использовалась node версии 8.9.4

Полная документация API: https://app.swaggerhub.com/apis/Satrige/parkovki/0.0.1#

Для запуска, нужно скопировать репозиторий.

Потом npm install

Для работы сервиса нужен работающий инстанс монги. Для инициализации нужно прокинуть переменные окружения
DB_HOST,DB_PORT, DB_NAME. Либо напрямую изменить эти значения в файле config.js. 

Дальше npm start

Для запуска тестов: npm test

Для того, чтобы выставить уровень логов, нужно прокинуть переменную окружения LOG_LEVEL.

Возможные значения: 'TRACE','DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'. По умолчанию стоит DEBUG.

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

### Добавление новой записи для работника

curl -X POST   http://localhost:3000/calendar -H 'content-type: application/json'  -d '{
    "name":"first",
    "email":"test1@test.test",
    "date":"01.01.1980",
    "status":"work"
}'

По умолчанию включена проверка на то, что работник с указанным email'ом существует в базе.
Чтобы это отключить, нужно добавить query-параметр check=false

### Обновление записи для работника

curl -X PUT \
  http://localhost:3000/calendar/5a807dda9ac5de3adba51002 \
  -H 'content-type: application/json' \
  -d '{
    "note": "123"
}'

У записи нельзя обновлять поля email и date. Если это все же нужно сделать, нужно удалить запись из базы.
А потом добавить новую, корректную.

### Удаление записи

curl -X DELETE \
  http://localhost:3000/calendar/5a807dda9ac5de3adba51002
  
### Получение информации записей из календаря

По id:

curl -X GET \
  http://localhost:3000/calendar/5a807dda9ac5de3adba51002
  
С указанием даты и email:

emails - массив с электронными адресами
from и to - даты, соответственно начала и конца нужного периода

curl -X GET \
  'http://localhost:3000/calendar/?emails=%5B%22alanis_simonis1959%40example.com%22%5D&from=01.01.1980&to=08.01.1980'
  
И даты и email в этом случае не являются обязательными параметрами.
**Если вызвать метод без параметров, то будет выгружаться вся база.**

### Получение статистики для указанных пользователей

emails - массив с электронными адресами
from и to - даты, соответственно начала и конца нужного периода

curl -X GET \
  'http://localhost:3000/calendar/stat/?emails=%5B%22alanis_simonis1959%40example.com%22%5D&from=01.01.1980&to=08.01.1980'

### Загрузка файла с информацией о рабочих днях пользователей

curl -i -X POST -H "Content-Type: multipart/form-data"  -F "file=@workdays-testdata.json" http://127.0.0.1:3000/calendar/upload

В сервисе реализована проверка на то, что пользователь с email'ом, указанным в записи, обязательно должен существовать в базе.
По умолчанию, она отключена. Для того, чтобы ее включить нужно добавить query-параметр check=true


