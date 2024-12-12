// file to auth the user, create a database and create de user in the new database
// run: mongo localhost:27017/boostrap-dev.js

const USER = process.env.MONGO_INITDB_ROOT_USERNAME;
const PASSWORD = process.env.MONGO_INITDB_ROOT_PASSWORD;

print('USER:', USER);
print('PASSWORD', PASSWORD);

db = db.getSiblingDB('admin');

db.auth(USER, PASSWORD);

db = db.getSiblingDB('syncroniza');

db.createUser({
  user: USER,
  pwd: PASSWORD,
  roles: ['readWrite', 'dbAdmin'],
});

print('User created');
