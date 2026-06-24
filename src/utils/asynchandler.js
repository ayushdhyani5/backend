// asyncHandler takes an async controller function as input
const asyncHandler = (reqHandler) => {

    // Returns a new middleware function that Express can use
    return (req, res, next) => {

        // Executes the controller function
        // Promise.resolve() ensures both async and normal functions work
        Promise.resolve(reqHandler(req, res, next))

            // If any error occurs, pass it to Express error middleware
            .catch((err) => next(err));
    };
};


// another method
// const asyncHandler=(fun)=>async(req,res,next)=>{
//     try{
//         await fun(req,res,next)
//     }catch(error){
//         res.status(error.code || 500).json({
//             success : false,
//             message : error.message
//         })
//     }
// }
export { asyncHandler };
