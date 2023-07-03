set -e

mongo <<EOF
db = db.getSiblingDB('tpiotdb')

db.createUser({
  user: 'api',
  pwd: '$TPIOTDB_PASSWORD',
  roles: [{ role: 'readWrite', db: 'tpiotdb' }],
});
db.createCollection('sensors')
db.createCollection('temperatures')
EOF