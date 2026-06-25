import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { upload } from "../middlewares/multer.midleware.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
    //get user detail from frontend
    // validation ->empty or not

    //  existance -> check if user is already exist : username and email
    // check for images,avatar
    // upload on cloudinary
    // create user object on mongo db
    // remove password and refresh token field from response
    // check for user creation
    //return res
    console.log("request body : ", req.body)
    const { username, email, password, fullName } = req.body
    console.log("email", email)

    if ([fullName, email, password, username].some((field => field?.trim() === ""))) {

        throw new ApiError(400, "all fields are required")
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    console.log("existingUser", existingUser)
    if (existingUser) {
        throw new ApiError(409, "user already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    console.log("files", avatarLocalPath, coverImageLocalPath)
    // if (!avatarLocalPath) {
    //     throw new ApiError(400, "Avatar file is required")
    // }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log(avatar)

})



export { registerUser }

