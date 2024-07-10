class ExpressError extends Error{
    constructor(statusc,message){
        super();
        this.statusc=statusc;
        this.message=message;
    }
}
module.exports=ExpressError;