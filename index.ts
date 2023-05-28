// SKYline Pilots and ATCs online time statistics program
// Copyright © SKYline Flyleague Development Group 2021-2022. All rights reserved
// Last created and edited by 2287
const axios = require('axios')
const fs = require('fs')

interface OnlineUser{
    cid: string,
    callsign: string,
    dep?: string,
    arr?: string,
    created_time: number
    updated_time?: number
}

let pilot_arr: Array<OnlineUser> = []
let atc_arr: Array<OnlineUser> = []

function getTimeStamp(): number{
    return new Date().getTime()
}

function calcOnlineTime(data: OnlineUser): string{
    return ((data.updated_time - data.created_time)/1000).toFixed(0)
}

function updateData(index: number, type: string): void{
    if (type == 'PILOT'){
        //检测更新数据
        let data = pilot_arr[index]
        data.updated_time = getTimeStamp()
    }else if (type == 'ATC'){
        let data = atc_arr[index]
        data.updated_time = getTimeStamp()
    }
}

function checkExisted(): void{
    pilot_arr.forEach( (data,index) =>{
        if (!data.updated_time){
            data.updated_time = getTimeStamp()
        }else{
            if (getTimeStamp() - data.updated_time > 4000){
                let url = `your API url path`
                axios.post(url).then( res =>{
                    console.log(`pilot ${data.cid} offline, updated to database`)   
                }).catch(e =>{
                    console.log(`pilot ${data.cid} offline, but no data updated`)
                })
                pilot_arr.splice(index,1)
            }
        }
    })
    atc_arr.forEach( (data,index) =>{
        if (!data.updated_time){
            data.updated_time = getTimeStamp()
        }else{
            if (getTimeStamp() - data.updated_time > 4000){
                let url = `your API url path`
                axios.post(url).then( res =>{
                    console.log(`atc ${data.cid} offline, updated to database`)   
                }).catch(e =>{
                    console.log(`atc ${data.cid} offline, but no data updated`)
                })
                atc_arr.splice(index,1)
            }
        }
    })
}

function mainProcess(): void{
    fs.readFile(__dirname+'/whazzup/whazzup.txt',(err,info)=>{
        if (err) return
        let res = info.toString()
        let original_data: Array<string> = res.split('!CLIENTS')[1].split('!SERVERS')
        if (!original_data.length){
            //空数组
            return
        }
        let data: Array<string> = original_data[0].split('\n')
        data.forEach((item,index) =>{
            let d = item.split(':')
            let cid = d[1]
            let type = d[3]
            let callsign = d[0]
            if (type == 'PILOT'){
                let dep = d[11]
                let arr = d[13]
                //判断机组是否存在
                let isIndexAble = pilot_arr.findIndex(value => value.cid == cid)
                if (isIndexAble != -1){
                    //机组存在，去更新机组数据
                    updateData(isIndexAble,type)
                }else{
                    //机组不存在，去创建机组对象
                    pilot_arr.push({cid,dep,arr,created_time:getTimeStamp(),callsign})
                }
            }else if(type == 'ATC'){
                let isIndexAble = atc_arr.findIndex(value => value.cid == cid)
                if (isIndexAble != -1){
                    //更新管制员数据
                    updateData(isIndexAble,type)
                }else{
                    //管制员不存在，创建管制员对象
                    atc_arr.push({cid,created_time:getTimeStamp(),callsign})
                }
            }
        })
        checkExisted()
    })
}

mainProcess()
setInterval(mainProcess,2000)
