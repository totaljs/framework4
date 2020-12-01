require('../index');

ROUTE('POST /api/likes/ *Like --> @save', ['id:like']);


console.log(F.routes.web.findItem('id', 'like'));

