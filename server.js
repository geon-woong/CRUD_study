const express = require('express');
const app = express();
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs')
const methodOverride = require('method-override')
app.use(methodOverride('_method'))


// html 띄워주는 코드
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
});
app.get('/write', (req, res) => {
    res.sendFile(__dirname + '/write.html')
});
app.get('/list', (req, res) => {

    //db에 post 저장된 모든 데이터 가져오기
    db.collection('post').find().toArray((err, 결과) => {
        console.log(결과);
        res.render('list.ejs', { posts: 결과 });
    });
})
app.get('/detail/:id', (req, res) => {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (err, 결과) {
        res.render('detail.ejs', { data: 결과 })
    })
})
app.get('/edit/:id', function (요청, 응답) {
    db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
        응답.render('edit.ejs', { post: 결과 })
    })

});

// 데이터베이스 연동코드
var db;

MongoClient.connect('mongodb+srv://woong:0000@cluster0.g8rqf.mongodb.net/todo?retryWrites=true&w=majority', function (에러, client) {
    if (에러) return console.log(에러);
    //todo라는 db 연결
    db = client.db('todo');

    //서버띄우는 코드 여기로 옮기기
    app.listen('8080', function () {
        console.log('listening on 8080')
    });
})


//
app.post('/add', function (요청, 응답) {
    db.collection('counter').findOne({ name: '게시물' }, function (에러, 결과) {
        var 총게시물갯수 = 결과.totalPost;
        db.collection('post').insertOne({ _id: (총게시물갯수 + 1), title: 요청.body.title, date: 요청.body.date }, function () {
            db.collection('counter').updateOne({ name: '게시물' }, { $inc: { totalPost: 1 } }, function (err, 결과) {
                if (err) { return console.log(err) }
                응답.send('전송완료');
            })
        });
    });

});

//삭제 요청 코드
app.delete('/delete', function (req, res) {
    req.body._id = parseInt(req.body._id);
    //req.body에 담겨온 게시물번호를 가진 글을 db에서 찾아 삭제하라
    db.collection('post').deleteOne(req.body, function (err, 결과) {
        console.log('삭제완료');
        res.status(200).send({ message: 'success' });
    })
});

//수정
app.put('/edit', function (req, res) {
    db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { title: req.body.title, date: req.body.date } }, function (err, 결과) {
        console.log('수정완료');
        res.redirect('/list');
    });
});