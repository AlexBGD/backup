cvar child_process = require('child_process'),
          fs=require('fs'),
          SimpleMail=require('/home/Aleksa/Mail/SendMail/SimpleMail.js');

/**
 * 
 * @param {type} callback
 * @returns {Process}
 * 
 * Da bih se dodao novi backup file(sa db)
 * dodati novi objekat u Process.prototype.backup=[];
 * -------------------------------------------------
 * Nije namesteno da se cuva samo baza bez sajta...
 * -------------------------------------------------
 * 
 * 
 * 
 * 
 */
var Process=function(callback){
    this.db_user_name='*****';
    this.db_pass='*****';
    this.errors=[];
    this.result=[];
    this.cur_date=new Date().getTime();
    this.call=callback;
    var that=this;
    //site call
     this.clean(function(){
       that.zip_site();
     });
};
//static index
Process.index=0;


/**
 * 
 * @type Array
 * save_location - lokacija na kojoj se cuva file(backup lokacija)
 * file_location - lokacija na kojoj se nalazi file koji koji treba da se cuva
 * db.file_save_name - ime file koji se zipuje(novi zipovan file);
 * db.db_name - ime baze 
 * 
 * 
 * 
 * 
 */
Process.prototype.backup=[
    {
         save_location:"/home/Aleksa/Backup/nadjinekretnine/",
         file_location:"/var/www/nadjinekretnine.com",
         file_save_name:'nn.zip',
         db:{
             file_save_name:'nn.sql.gz',
             db_name:'nekretnine_project_baza'
         }
     },
      {
         save_location:"/home/Aleksa/Backup/altheafengshui/",
         file_location:"/var/www/altheafengshui.com",
         file_save_name:'afs.zip'
     },
]

/**
 * 
 * @returns {Boolean}
 * 
 * OPIS:
 * -----
 * vrti u loop array backup ,
 * pravi dir sa datumom (current)
 * zatim izvrsava shell command koji zipuje file i cuva ga na this.bockup.save_location;
 * zatim izvrsava shell koji zipuje bazu pozivom na this.zip_db() 
 * i to je sve odprilike...
 * na kraju poziva this.callback();
 * 
 * 
 * 
 */
Process.prototype.zip_site=function(){ 
    if (Process.index>this.backup.length-1) {
       this.callback();
        return false;
    }
     var file=this.backup[Process.index],
             that=this,
             newDir=file.save_location+this.cur_date;
     
     fs.mkdir(newDir,function(err){
    if (err) {
        that.errors.push({
            'file system':{
                backup:file,
                message:err
            }
            
        });
        Process.index++;
     that.zip_site();
        return false;
    }

   
                 child_process.exec('zip -r '+newDir+"/"+file.file_save_name+' '+file.file_location, {maxBuffer: 1212112 * 12500}, function(error, stdout, stderr){
    if (error) {
       that.errors.push({
           'child prodess':{
               backup:file,
               message:error
           }
       });
     
    }else{
         console.log(file.file_location+" je uspesno zipovan i sacuvan!");
    }
    
            if ('db' in file) {
                
           that.zip_db(file.db.db_name,newDir+'/'+file.db.file_save_name,function(){
               Process.index++;
     that.zip_site();
           })     
                
                
            }else{
                Process.index++;
     that.zip_site();
            }
     	//console.log(stdout);//show result
});
 });
 
}



/**
 * 
 * @param {type} db_name
 * @param {type} zip_dir
 * @param {type} callback
 * @returns {undefined}
 * 
 * 
 */
Process.prototype.zip_db=function(db_name,zip_dir,callback){
    var that=this;
    child_process.exec('mysqldump -u '+this.db_user_name+' -p"'+this.db_pass+'"  '+db_name+' | gzip > '+zip_dir, {maxBuffer: 1212112 * 12500}, function(error, stdout, stderr){
    if (error) {
        that.errors.push({
                  'zip_db':{
                      backup:db_name,
                      message:error
                  }
              });
 
    }else{
            console.log('Tabela '+db_name+' je uspesno sacuvana!');
    }
       
	 callback()
        
});


    
    
    
}


Process.prototype.clean=function(callback){
    
    
    function get_days(milisec){
         var d=new Date().getTime();
         var f=new Date();f.setTime(milisec);
         return Math.floor((d-f) / (1000*60*60*24))
    }
    
    
    
    

 
 var res,
     result;

for(var d=0;d<this.backup.length;d++){ 
        if (!'save_location' in this.backup[d]) {
            continue;
        }
        dir=this.backup[d].save_location;
        result=fs.readdirSync(dir) 
   
    
     
    for(var i=0;i<result.length;i++){
        if (parseInt(result[i])==result[i]&&get_days(parseInt(result[i]))>7) {
                res=fs.readdirSync(dir+result[i]);
                for(var x=0;x<res.length;x++){
                    fs.unlinkSync(dir+result[i]+'/'+res[x]);
                }
                fs.rmdirSync(dir+result[i]);
                    
        }
    }
  
 
 
}

    callback()
     
    
}






/**
 * 
 * @returns {undefined}
 * 
 * Ako ima gresaka salje mail 
 * 
 * 
 */
Process.prototype.callback=function(){
    
    if (this.errors.length>0) {
        var that=this;
        console.log('Backup done with some errors:');
        console.log(this.errors);
        var mail=new SimpleMail.simple_mail();
         mail.set_options({
            service:'Gmail',
            user_name:'********',
            pass:'*****',
            from:'me',
            to:'*********',
            subject:'Obavestenje: Doslo je do backup greski!',
            html:'<p>Backup done with some errors:</p>'+JSON.stringify(that.errors)

         });
 

            mail.createTransport();
            mail.sendMail(function(msg){
                console.log(msg)
            });
    }else{
        console.log('Backup done with no errors!');
    }
    //callback end notify
    this.call()
    
}

 

// Functions which will be available to external callers
exports.backup = Process;
