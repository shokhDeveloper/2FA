const {Schema, model} = require("mongoose");

const phoneNumberRegex = /^\+9989[012345789][0-9]{7}$/;
const emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

const userSchema = new Schema({
    first_name: {
        type: String,
        trim: true,
        required: [true, "First name is required !"],
    },
    last_name: {
        type: String,
        trim: true,
        required: [true, "Last name is required !"], 
    },
    phone: {
        type: String,
        trim: true,
        match: [phoneNumberRegex, "Phone number is invalid !"],
        required: [true, "Phone number is required !"]
    },
    email: {
        type: String,
        trim: true,
        unique: [true, "User already exists !"],
        match: [emailRegex, "Email is invalid !"],
        required: [true, "Email is required !"]
    },
    password: {
        type: String,
        trim: true,
        minlength: [5, "Password must be at least 5 characters long"],
        required: [true, "Password is required !"]
    },
    role: {
        type: String,
        trim: true,
        default: 'user',
        enum: {
            values: ['user', 'admin'],
            message: '{VALUE} is invalid !'
        }
    },
    otp: {
        type: String
    },
    isVerified:{
        type: Boolean,
        default: false,
    },
    otpTime: {
        type: Number,
        required: [true, 'Otp time is required !']
    },
    refreshTokens: [
        {
            token: { type: String, trim: true, required: true },
            role: {
                type: String,
                trim: true,
                default: 'user',
                enum: {
                    values: ['user', 'admin'],
                    message: '{VALUE} is invalid !'
                }
            },
            userAgent: { type: String },
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, {
    versionKey: false,
    timestamps: true
})

module.exports = model("users", userSchema);
