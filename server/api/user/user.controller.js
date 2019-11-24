'use strict';

var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');

var validationError = function(res, err) {
  return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  console.log(req)
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.status(500).send(err);
    res.status(200).json(users);
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  console.log(req.body)
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.password=req.body.dob
  newUser.save(function(err, user) {
    if (err) return validationError(res, err);
    var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
    res.json({ token: token ,user:user});
  });
};
exports.adduserfromexcel = async function(req,res,next){
  var successdata=[]
  var userexistdata=[]
  var faileddata=[]
  // excel sheet format 
  var rawdata=[ 'SNO',
  'NAME',
  'FATHERNAME',
  'DOB',
  'CASTE',
  'AADHAR',
  'QUALIFICATION',
  'STATUS',
  'COURSE',
  'BATCHTIME',
  'ADDRESS',
  'EMAIL',
  'CONTACTNO',
  'GENDER',
  'ADMISIONNO' ]

 if(JSON.stringify(req.body[0])==JSON.stringify(rawdata))
 {
   if(req.body && req.body.length!=1){
    var count =0

    for (let data of req.body) {
     
      if(count!=0){
             var usersdata={
               name:data[1],
               fathername:data[2],
               dob:data[3],
               caste:data[4],
               aadhar:data[5],
               password:data[3],
               qualification:data[6],
               status : data[7],
               course:data[8],
               batchtime:data[9],
               address:data[10],
               email:data[11],
               mobilenumber:data[12],
               gender:data[13],
               admissionno:data[14],
               active : true,
             }
            }
            var name =/^[a-zA-Z]+$/
            var mailformat = /^([A-Za-z]|[0-9])[A-Za-z0-9.-]+[A-Za-z0-9]@((?:[-a-z0-9]+\.)+[a-z]{2,})$/
            var mobilepat=/^\d{10}$/; 
            if( usersdata && usersdata.gender)  
            if(usersdata && mailformat.test(String(usersdata.email).toLowerCase()) && name.test(String(usersdata.name)) && name.test(String(usersdata.fathername)) && ((String(usersdata.gender).toLowerCase()==='f')||(String(usersdata.gender).toLowerCase()==='male')||(String(usersdata.gender).toLowerCase()==='m')||(String(usersdata.gender).toLowerCase()==='female')) && mobilepat.test(usersdata.mobilenumber) && usersdata.aadhar)
            {  
              if((String(usersdata.gender).toLowerCase()==='f')||(String(usersdata.gender).toLowerCase()==='female')){
                usersdata.gender="Female"
              }
              if((String(usersdata.gender).toLowerCase()==='male')||(String(usersdata.gender).toLowerCase()==='m')){
                usersdata.gender="Male"
              }
              try {
                let found = await User.findOne({ $and:[{email: usersdata.email.toLowerCase()},{course:usersdata.course},{admissionno:usersdata.admissionno}]}).exec();
               if(found!=null) userexistdata.push(usersdata);
               if(!found )
               {
                 let usercreate = await  User.create(usersdata,   async function (err, user) {
                  if (err) {
                  
               
                  }
                  else {
                  return user;   
                  }
                })
                 if(usercreate)successdata.push(usercreate)
              } else if(!found && !department){
                faileddata.push(usersdata)
              }
        
            } catch(e) {
            }
            }
            else {
               if(count!=0)faileddata.push(usersdata)
            }
  
      count++
    }
      res.json({ "success": successdata, "faileddata": faileddata, "userexistdata": userexistdata })
  }
  else {
    res.json({"res":"Empty data"})
  }
   }

  else {
    res.json({ "res": "Invalid excel format" })
  }
}
/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user.profile);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) return res.status(500).send(err);
    return res.status(204).send('No Content');
  });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).send('OK');
      });
    } else {
      res.status(403).send('Forbidden');
    }
  });
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user);
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
