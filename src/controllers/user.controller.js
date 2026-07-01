import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { upload } from "../middlewares/multer.midleware.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return {
            accessToken,
            refreshToken
        }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}


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
    // console.log("request body : ", req.body)
    const { userName, email, password, fullName } = req.body


    if ([fullName, email, password, userName].some((field => field?.trim() === ""))) {

        throw new ApiError(400, "all fields are required")
    }

    const existingUser = await User.findOne({
        $or: [{ userName }, { email }]
    })
    console.log("existingUser", existingUser)
    if (existingUser) {
        throw new ApiError(409, "user already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    // console.log("files", avatarLocalPath, coverImageLocalPath)
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    // console.log(avatar);

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Error while uploading on cloudinary")
    }
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        email,
        password,
        userName: userName.toLowerCase(),
        coverImage: coverImage?.url || ""
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken ")
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user")
    }

    return res.status(201).json(new ApiResponse(200, createdUser, "User created successfully"))
})


const loginUser = asyncHandler(async (req, res) => {
    //get data from req
    const { userName, password, email } = req.body
    if (!(userName || email)) {
        throw new ApiError(400, "username or email is required")
    }
    //check if exist
    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "user not found")
    }
    //compare password
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "incorrect password")
    }

    //access and refresh token 
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    //send cookies 
    const loggedInUser = await User.findOne(user._id).
        select("-password -refreshToken ")

    const options = {
        httpOnly: true,
        secure: true,

    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            }, "User logged in successfully")
        )
})


const logoutUser = asyncHandler(async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken: undefined
                }
            },
            {
                new: true
            }
        )
        const options = {
            httpOnly: true,
            secure: true,
        }
        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged out successfully"))
    } catch (error) {
        new ApiError(500, "something went wrong")
    }
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        if (!decodedToken) {
            throw new ApiError(401, "unauthorized")
        }
        const user = await User.findOne(decodedToken._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        if (user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Refresh token expired or invalid")
        }


        //now generate new access token 
        const options = {
            httpOnly: true,
            secure: true,
        }
        const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);
        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, {
                    user: user,
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                }, "Token refreshed successfully")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token");
    }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(401, "incorrect password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res
        .status(200)
        .json(new ApiResponse(200, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User fetched successfully"))
})


const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    if (!fullName && !email) {
        throw new ApiError(400, "Please provide at least one field")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { fullName, email } },
        { new: true }
    ).select("-password -refreshToken")
    return res
        .status(200)
        .json(new ApiResponse(200, user, "User Details updated successfully"))
})


const updateUserAvatar = asyncHandler(async (req, res) => {
    // take the image from 
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar image is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    // delete avatar

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"))


})


const updateUserCoverImage = asyncHandler(async (req, res) => {
    // take the image from 
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover Image is required")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading an coverImage")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password -refreshToken")
    return res
        .status(200)
        .json(new ApiResponse(200, user, "coverImage updated successfully"))


})


// get channel profile by userName
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if(!username?.trim()){
        throw new ApiError(400,"userName missing")
    }
    //aggregate pipelines
    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }

        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in:[req.user?._id,"$subscribers.subscriber"]} ,      
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                avatar:1,
                coverImage:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"No channel found")
    }

    return res.
    status(200).
    json(new ApiResponse(200,channel,"Channel details fetched successfully"))


})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}