const express = require('express');
const app = express();
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs')
const methodOverride = require('method-override')
app.use(methodOverride('_method'))


// GET 요청 get 함수 첫번 째 인자 url을 요청하면  콜백함수 내용을 응답한다.
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
});
app.get('/write', (req, res) => {
    res.sendFile(__dirname + '/write.html')
});
app.get('/list', (req, res) => {

    //db에 post 저장된 모든 데이터 가져와서 Array에 담아 결과로 전달됨.  list 페이지에서 사용할 수 있게 렌더 함수에 담음
    db.collection('post').find().toArray((err, 결과) => {
        console.log(결과);
        res.render('list.ejs', { posts: 결과 });
    });
})
// get 요청으로 상세페이지 띄우기 
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
// 로그인페이지
app.get('/login', (req, res) => {
    res.render('login.ejs');
})

// 몽고디비 연결 코드
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


// post 요청했을 때 , db 카운터에 게시물이라는 이름의 데이터를 찾아서 totalPost 프로퍼티를 변수에 담는다.
app.post('/add', function (요청, 응답) {
    db.collection('counter').findOne({ name: '게시물' }, function (에러, 결과) {
        var 총게시물갯수 = 결과.totalPost;

        //post 요청될 때 아래 내용의 데이터를 db에 생성하고 카운터 시트에 totalPost id를 갱신
        db.collection('post').insertOne({ _id: (총게시물갯수 + 1), title: 요청.body.title, date: 요청.body.date }, function () {
            db.collection('counter').updateOne({ name: '게시물' }, { $inc: { totalPost: 1 } }, function (err, 결과) {
                if (err) { return console.log(err) }
                응답.send('전송완료');
            })
        });
    });

});

//삭제 요청 코드
//요청 받은 바디에 담긴 아이디를 정수화하여 포스트에서 삭제
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

// 회원인증관련 라이브러리
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), function (req, res) {
    res.redirect('/')
});

app.get('/mypage', didulogin, function (req, res) {
    res.render('my.ejs', { 사용자: req.user })
})

function didulogin(req, res, next) {
    if (req.user) {
        next()
    } else {
        res.send('u didnt login')
    }
}


passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
        if (에러) return done(에러)

        //일치 하는 것이 없을 때 done 을 실행, 
        if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
        //DB에 아이디가 있으면 입력한 비번과 결과 pw 비교
        if (입력한비번 == 결과.pw) {
            return done(null, 결과)
        } else {
            return done(null, false, { message: '비번틀렸어요' })
        }
    })
}));

passport.serializeUser(function (user, done) {
    done(null, user.id)
});
//세션을 찾을 때 실행되는 함수  로그인한 유저의 개인정보를 디비에서 찾는 역할
passport.deserializeUser(function (아이디, done) {
    db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) {
        done(null, 결과)

    })
});