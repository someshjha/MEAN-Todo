require('./../server/config/config');

const _ = require('lodash')
const {ObjectId} = require('mongodb');
const express = require('express');
const bodyParser = require('body-parser');

var {mongoose} = require('./../server/db/mongoose');
var {Todo} = require('./../server/models/todo');
var {User} = require('./../server/models/user');
var {authenticate} = require('./../server/middleware/authenticate');


var router = express.Router();

// router.use(bodyParser.json());

router.post('/todo', authenticate, (req, res) => {
    var todo = new Todo({
        text: req.body.text,
        _creator: req.user._id
    });

    todo.save().then((doc) => {
        res.status(201).send(doc)
    }, (e) => {
        console.log('Unable to create todo', e);
        res.status(400).send(e);
    });
});

router.get('/todos', authenticate, (req, res) => {
    Todo.find({
        _creator: req.user._id
    }).then((todos) => {
        res.status(200).send({
            todos
        });
    }, (e) =>{
        res.status(400).send(e);
    })
});

router.get('/todos/:id', authenticate, (req, res) => {
    var {id} = req.params;
    if(!ObjectId.isValid(id)){
        return res.status(400).send({error: `Id: ${id} is not valid`});
    }

    Todo.findOne({
        _id: id,
        _creator: req.user._id
    }).then((todo) => {
        if(!todo) {
            res.status(404).send({error: 'Todo not found.'});
        }
        res.status(200).send({todo});
    });

}, (e) => {
    res.status(400).send(e);
});

router.delete('/todos/:id', authenticate, (req, res) => {
    var {id} = req.params;
    if(!ObjectId.isValid(id)){
        return res.status(400).send({error: `Id: ${id} is not valid`});
    }

    Todo.findOneAndRemove({
        _id: id, 
        _creator: req.user._id
    }).then((todo)=> {
        if(!todo) {
            res.status(404).send({error: 'Todo not found.'});
        }
        res.status(200).send({todo});
    }).catch((e)=>{
        res.status(400).send(e);
    });
});

router.patch('/todos/:id', authenticate, (req, res) => {
    var {id} = req.params;
    var body = _.pick(req.body, ['text', 'completed']);
    if(!ObjectId.isValid(id)){
        return res.status(400).send({error: `Id: ${id} is not valid`});
    }

    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findOneAndUpdate({
        _id: id,
        _creator: req.user._id
    }, {
        $set: body
    }, {
        new: true
    }).then((todo) => {
        if(!todo) {
            return res.status(404).send({error: `Id: ${id} is not found`});
        }

        res.send({todo});

    }, (e) => {
        res.status(400).send();
    })

});

// POST /user
router.post('/user', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);
    var user = new User(body);

    user.save().then(() => {
        return user.generateAuthToken();
    }).then((token) => {
        res.status(201).header('x-auth', token).send(user);
    }).catch((e) => {
        res.status(400).send(e);
    });
});



router.get('/users/me',authenticate, (req, res) => {
    res.send(req.user);
});


router.post('/users/login', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);

    User.findByCredentials(body.email, body.password).then((user) => {
        return user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user);
        });
    }).catch((e) => {
        res.status(400).send();
    });

});

router.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }, () => {
        res.status(400).send();
    });
});

module.exports = router;