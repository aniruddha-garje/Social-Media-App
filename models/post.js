const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
	title: {
		type: String
	},
	body: {
		type: String
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: 'user'
	},
	status: {
		type: String,
		default: 'public'
	},
	allowComments: {
		type: Boolean,
		default: true
	},
	date: {
			type: Date,
			default: Date.now
	},
	comments: [{
		commentBody:{
			type: String
		},
		commentUser: {
			type: Schema.Types.ObjectId,
			ref: 'user'
		},
		commentDate: {
			type: Date,
			default: Date.now
		}
	}]
	
});

module.exports = mongoose.model('posts',postSchema);