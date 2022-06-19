const fs = require('fs');
const { exec } = require("child_process");


const d = JSON.parse(fs.readFileSync('./src/manifest.json'))
const f = async () => {
    let xx = d.map(async (x) => {

        const publicUrl = x.publicUrl;
        const urls = publicUrl.split('/');
        const filename = urls[urls.length - 1];
    
       
        x = await new Promise((resolve, reject) => {
            
            exec(`curl ${publicUrl} -o preload_proc_blocks/${filename}`, (error, stdout, stderr) => {
                if (error) {
                    //console.log(`error: ${error.message}`);
                    reject();
                }
                if (stderr) {
                    //console.log(`stderr: ${stderr}`);
                   // reject();
                }
                x.publicUrl = `$RESOURCE/preload_proc_blocks/${filename}`
                resolve(x)
            })
        })
    
        return x
    })
    
    xx = await Promise.all(xx)

    console.log(JSON.stringify(xx))
    
}


f().then(() => {})