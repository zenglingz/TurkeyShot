/**
 * Created by zWX563657 on 2018/9/4.
 */
define(['echarts','jsmind'],function(echarts,jsMind){
    var tools=new Object();
    tools= {
        //�ж�ʱ������ʱ/ʣ��ʱ������սʱ������ʱ��־
        countInterruptTime: function (_curentTime,failureTime,recoveryTime) {//��ǰʱ�䡢���Ϸ���ʱ�䡢ҵ��ָ�ʱ��
            //ҵ��ָ�ʱ��Ϊ��ʱ����ǰʱ��-���Ϸ���ʱ�䣬����ҵ��ָ�ʱ��-���Ϸ���ʱ��
            var occurTime = new Date(failureTime).getTime();
            var time=recoveryTime?recoveryTime:_curentTime;
            var timeDiff=new Date(time).getTime()-occurTime;
            if (timeDiff < 0) {
                return 'δ֪'
            }
            return parseInt(timeDiff / 1000 / 60);
        },
        countDuration: function (_curentTime,param) {
            //״̬�ѻָ�ȡWarDuration,��ǰʱ��-����ʱ��  1�ѻָ�
            if (param.Status == '1') {
                return this.timeFormat(param.WarDuration*60*1000);
            }
            var curentTime = new Date(_curentTime).getTime();
            var createTime = new Date(param.CreateTime).getTime();
            var timeDiff = curentTime - createTime;
            if (timeDiff < 0) {
                return 'δ֪?';
            }
            return this.timeFormat(timeDiff);
        },
        timeOut:function(recoveryTime,nowTime,fixTime){
            let flag=false;
            ((recoveryTime&&recoveryTime>fixTime)||(!recoveryTime&&nowTime>fixTime))?(flag=true):'';
            return flag;
        },
        RemainingTime:function(nowTime,fixTime,recoveryTime){
            let time=recoveryTime?recoveryTime:nowTime;
            let timeDiff=Math.abs(new Date(time).getTime()-new Date(fixTime).getTime());
            return this.timeFormat(timeDiff);
        },
        getTimes:function(time){//��XX:XX:XXʱ��ת���ɺ���,
            let timeArr=time.split(':');
            return timeArr[0]*1000*60*60+timeArr[1]*1000*60+timeArr[2]*1000;
        },
        timeFormat: function (msec) {//��������ʱ��ת����XX:XX:XX��ʽ
            var h=parseInt(msec/1000/60/60);
            var m=parseInt(msec%(1000*60*60)/1000/60);
            var s=parseInt(msec%(1000*60)/1000);
            return h+':'+((m+100+'').slice(1))+':'+((s+100+'').slice(1));
        },


        //����ows�ӿ�
        transferOws:function(owsUrl){
            let dtd = $.Deferred();
            $.ajax({
                url:'https://'+soketIP+'/ReportService/BigScreen/GetHttpsRequestMessageAsync',
                //url:'https://10.206.187.85:5001/ReportService/BigScreen/GetHttpsRequestMessageAsync',
                dataType:'json',
                type:'get',
                data:{
                    url: owsUrl
                },
                success:function(data){
                    if(data.success){
                        var data=data.data?JSON.parse(data.data):JSON.parse(data.results);
                    }else{
                        var data='';
                    }
                    dtd.resolve(data);
                }
            });
            return dtd;
        },


        //������ʧ���ݴ���
        handleLoss:function(data){
            let result=data[0]?data[0].results[0]:'';
            if(result){
                APP.failureLoss.communication=result.loss_communi_ability?result.loss_communi_ability:'-';
                APP.failureLoss.users=result.loss_user_number?result.loss_user_number:'-';
                APP.failureLoss.business=result.loss_service_volume?result.loss_service_volume:'-';
                APP.failureLoss.economyLoss=result.economic_loss?result.economic_loss:'-';
            }else{
                APP.failureLoss.communication='-';
                APP.failureLoss.users='-';
                APP.failureLoss.business='-';
                APP.failureLoss.economyLoss='-';
            }

        },


        //����澯���ݴ���
        handleNetAlarm:function(data){
            let netAlarm=data[0]?data[0].results:'';
            if(netAlarm.length>0){
                APP.netWarn=[];
                $.each(netAlarm,function(index,item){
                    if(JSON.stringify(APP.networkAlarm).indexOf(item.ne_name)==-1){
                        APP.networkAlarm.push({netName:item.ne_name,isAdd:false});
                    }
                    APP.netWarn.push({
                        warnID: item.alarm_id?item.alarm_id:"",
                        netName: item.ne_name ? item.ne_name : "",
                        netType: item.ne_type ? item.ne_type : "",
                        warnName: item.alarm_name ? item.alarm_name : "",
                        warnStatus: item.alarm_status ? item.alarm_status : "",
                        warnLevel: item.alarm_level ? item.alarm_level : "",
                        start_time: item.start_time ? item.start_time : "",
                        alarm_resource_status:item.alarm_resource_status?item.alarm_resource_status:""
                    });
                });
            }
            let netArr=$('.network-alarm .networkAlarmCollapse .option[data-add="true"]');
            let addNet=[];
            $.each(netArr,function(index,item){
                addNet.push($(item).attr('data-net'));
            });
            addNet!=false&&tools.getAlarmBynet(addNet.join(','));
            //APP.selectedNetworkAlarm = APP.networkAlarm[0].netName;
        },
        getAlarmBynet:function(netName){
            let netAlarmUrl='https://'+owsIP+'/ws/rest/1002/callIRAdapter/ByNeName?ne_name='+netName;
            Promise.all([this.transferOws(netAlarmUrl)]).then(function(data){
                let netAlarm=data[0]?data[0].results:'';
                if(netAlarm.length>0){
                    $.each(netAlarm,function(index,item){
                        if(JSON.stringify(APP.networkAlarm).indexOf(item.ne_name)==-1){
                            APP.networkAlarm.push({netName:item.ne_name,isAdd:true});
                        }
                        APP.netWarn.push({
                            warnID: item.alarm_id?item.alarm_id:"",
                            netName: item.ne_name ? item.ne_name : "",
                            netType: item.ne_type ? item.ne_type : "",
                            warnName: item.alarm_name ? item.alarm_name : "",
                            warnStatus: item.alarm_status ? item.alarm_status : "",
                            warnLevel: item.alarm_level ? item.alarm_level : "",
                            start_time: item.start_time ? item.start_time : "",
                            alarm_resource_status:item.alarm_resource_status?item.alarm_resource_status:""
                        });
                    });
                }
            })
        },
        //���������ݴ���
        handleNeCleft:function(data){
            let netCleft=data[0]?data[0].results:'';
            if(netCleft.length>0){
                APP.netCleft=[];
                $.each(netCleft,function(index,item){
                    if(APP.networkCleft.indexOf(item.ne_name)==-1){
                        APP.networkCleft.push(item.ne_name);
                    }
                    APP.netCleft.push({
                        orderID:item.orderid?item.orderid:'',
                        netName:item.ne_name?item.ne_name:'',
                        cleftTime:item.status?item.status:'',
                        netType:item.ne_type?item.ne_type:'',
                        theme:item.title?item.title:'',
                        cleftType:item.cr_type?item.cr_type:'',
                        completeTime:item.wo114_submittime?item.wo114_submittime:'',
                        timeRange:item.status?item.status:''
                    })
                });
                APP.selectedNetworkCleft=APP.networkCleft[0];
            }
        },
        //�����������ݴ���
        handlePerformance:function(data){
            let result=data[0]?data[0].results:'';
            if(result.length>0){
                let postParam=[];
                $.each(result,function(index,item){
                    postParam.push({NetWorkType:item.ne_type,NetWorkName:item.ne_name});
                });
                tools.getPerformanceData(postParam);
            }
            let addNet=$('.net-performance .networkAlarmCollapse .option[data-add="true"]');
            let addParem=[];
            $.each(addNet,function(index,item){
                addParem.push({NetWorkType:'',NetWorkName:$(item).attr('data-net')});
            });
            addParem!=false&&tools.getPerformanceDataAdd(addParem);
        },
        getPerformanceData:function(postParam){
            this.performanceDataAjax(postParam).then(function(result){
                APP.netPerformance=result;
                APP.selectNetPerformanceIndex=0;
                APP.selectKPIIndex=0;
                let selectedPerformance=APP.netPerformance[APP.selectNetPerformanceIndex]
                this.lineChart('net-performance-chart0',selectedPerformance.networkData,this.changeKPIData(selectedPerformance.kpi[APP.selectKPIIndex].kpiData),selectedPerformance.kpi[APP.selectKPIIndex].kpiUnits)
            }.bind(this));
        },
        getPerformanceDataAdd:function(postParam){
            this.performanceDataAjax(postParam).then(function(result){
                result[0].isAdd='true';
                APP.selectNetPerformanceIndex=APP.netPerformance.length>0?APP.netPerformance.length:0;
                APP.netPerformance=APP.netPerformance.concat(result);
                APP.selectKPIIndex=0;
                let selectedPerformance=APP.netPerformance[APP.selectNetPerformanceIndex]
                this.lineChart('net-performance-chart0',selectedPerformance.networkData,this.changeKPIData(selectedPerformance.kpi[APP.selectKPIIndex].kpiData),selectedPerformance.kpi[APP.selectKPIIndex].kpiUnits);
            }.bind(this))
        },
        performanceDataAjax:function(postParam){
            let dtd = $.Deferred();
            $.ajax({
                url:'https://'+(env!='OuterNet'?(soketIP.split(":")[0]+':5002'):soketIP)+'/ReportService/BigScreen/AcquireNetworkPerformanceDataAsync',
                dataType:'json',
                data:{
                    viewModels:postParam
                },
                type:'post',
                success:function(data){
                    let result=data.length>0?data:[];
                    if(result.length>0){
                        dtd.resolve(result);
                    }else{
                        dtd.resolve('');
                    }
                }
            })
            return dtd;
        },
        //������������ͼ����
        lineChart: function (id, x,y,type) {
            var cv=echarts.init(document.getElementById(id));
            var options = {
                grid: {
                    left:100,
                    right: 20,
                    top: 40,
                    bottom: 40
                },
                xAxis: [{
                    type: 'category',
                    show:false,
                    show:true,
                    //data: this.splitTime('00:00', '24:00', 5),
                    data: x,
                    axisLabel: {
                        color: '#fff',
                        fontSize: '16',
                    },
                    axisLine: {
                        color: 'rgb(112,112,112)'
                    },
                    axisTick: {
                        show: false
                    }
                }/*,{
                 type:'value',
                 splitNumber:22,
                 min:0,
                 max:24,
                 show:true,
                 position:'bottom',
                 data:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
                 axisLabel: {
                 color: '#fff',
                 fontSize: '16',
                 },
                 axisLine: {
                 color: 'rgb(112,112,112)'
                 },
                 axisTick: {
                 show: false
                 },
                 splitLine:{
                 show:false
                 }
                 }*/
                ],
                yAxis: {
                    type: 'value',
                    axisLine: {
                        show: false
                    },
                    splitLine: {
                        lineStyle: {
                            color: 'rgb(28,49,115)',
                            type: 'dotted'
                        }
                    },
                    axisLabel: {
                        formatter: '{value}'+type,
                        color: '#fff',
                        fontSize: '16'
                    },
                    axisTick: {
                        show: false
                    }
                },
                tooltip: {
                    show: true,
                    trigger: 'axis',
                    axisPointer: {
                        type: 'line'
                    }

                },
                series: [{
                    type: 'line',
                    data: y,
                    showSymbol:false,
                    itemStyle: {
                        color: 'rgb(109,212,197)'
                    },
                    smooth: true
                }]
            };
            cv.setOption(options);
        },


        changeKPIData:function(data){
            let newData=JSON.parse(JSON.stringify(data));
            $.each(data,function(index,value){
                value=(newData[index]*100).toFixed(2);
                if(value==0){
                    value=index==0?"-":newData[index-1];
                }
                newData[index]=value;
            })
            return newData;
        },





        //������
        handleTree:function(data){
            if(!data[0]||JSON.stringify(data[0].results)=='{}'){
                APP.treeList=[];
                return;
            }
            APP.treeList=data[0].results;
            let res=data[0].results[0].rtn_arr;
            let treeList=tools.getTree(res);
            tools.showMind(treeList);
        },
        getTree:function(data){
            let treeList=new Object;
            for(var i=0;i<data.length;i++){
                if(data[i].is_root=='true'){
                    treeList.topic=data[i].topic;
                    treeList.id=data[i].element_id;
                    break;
                }
            }
            var temp=this.treeList(data,treeList.id,0);
            temp!=false&&(treeList.children=temp);
            return treeList;
        },
        treeList:function(data,pId,i){
            var results=[],
                temp;
            var level=i+1;
            $.each(data,function(index,item){
                if(item.parentid==pId){
                    var obj={
                        topic:item.topic,
                        id:item.element_id
                    }
                    level>=3&&(obj.expanded=false);
                    temp=this.treeList(data,item.element_id,level);
                    temp!=false&&(obj.children=temp);
                    results.push(obj);
                }
            }.bind(this))
            return results;
        },
        showMind: function (data) {
            var mind = {
                meta: {
                    "name": "jsMind-demo-tree",
                    "author": "hizzgdev@163.com",
                    "version": "0.2"
                },
                format: 'node_tree',
                /* �������� */
                data: data
            }
            $("#analysis-tree").empty();
            var options = {
                container: 'analysis-tree',
                editable: false,
                mode: 'side',
                theme: 'primary',
                view: {
                    hmargin: 30,
                    vmargin: 30,
                    line_color: 'rgb(163,164,179)'
                },
                layout: {
                    hspace: 30,
                    vspace: 20,
                    pspace: 15
                }
            }
            var jm = new jsMind(options);
            jm.show(mind);
            APP&&this.mindColor(APP.WarRoomTable);
        },
        mindColor: function (list) {
            /*for (var i = 0; i < list.length; i++) {
             //�����������Ϊ������λor�����ƶ���״̬Ϊִ���л���ɣ�ƥ������������������ڵ㣬ִ����״̬Ϊ��ɫ�����Ϊ��ɫ(�̶���·һֱΪ��)��
             if ((list[i].TaskType == '������λ' || list[i].TaskType == '�����ƶ�')&&(list[i].TaskStatus == 'ִ����'||list[i].TaskStatus == '���')) {
             var key = list[i].Title;
             this.changeMindColor(key, list[i].TaskStatus);
             }

             }*/
            $.each(list,function(index,item){
                if(item.TaskStatus=='ִ����'){
                    //$($($('.task-table tbody tr')[index]).children()[2]).removeClass().addClass('valid-text');
                    this.changeMindColor(item.Title,'valid',$($($('.task-table tbody tr')[index]).children()[2]));
                }else if(item.TaskStatus=='���'||item.TaskStatus=='ȡ��'){
                    if(item.FeedBack&&item.FeedBack.indexOf('ִ����Ч')!=-1){
                        //$($($('.task-table tbody tr')[index]).children()[2]).removeClass().addClass('valid-text');
                        this.changeMindColor(item.Title,'valid',$($($('.task-table tbody tr')[index]).children()[2]));
                    }else{
                        //$($($('.task-table tbody tr')[index]).children()[2]).removeClass().addClass('invalid-text');
                        this.changeMindColor(item.Title,'invalid',$($($('.task-table tbody tr')[index]).children()[2]));
                    }
                }else{
                    return;
                }
            }.bind(this))
        },
        changeMindColor: function (key, className,ele) {
            var jmnode = $('#analysis-tree jmnode');
            /*for (var i = 0; i < jmnode.length; i++) {
             if ($(jmnode[i]).html() == key) {
             if (status == '���' && key != '���������Ԫ��ͬһ�������й�����ѡAS��Ԫ���ֲ��ɴ�澯����·�澯' &&  key != '����AS�쳣' && key != '��SCSCF�����ô�������ҵ��ʧ�ܼ�������' ) {
             $(jmnode[i]).removeClass().addClass('invalid');
             }else{
             $(jmnode[i]).removeClass().addClass('valid');
             if (key == '��SCSCF�����ô�������ҵ��ʧ�ܼ�������') {
             $('.urgent-plan').show();
             }
             }
             }
             }*/
            $.each(jmnode,function(index,item){
                if($(item).text().trim()==key.trim()){
                    ele.removeClass().addClass(className+'-text');
                    $(item).removeClass().addClass(className+'-color');
                }
            })
        },
        //Ӧ��Ԥ���б�
        getDocList:function(){
            let docUrl='https://'+owsIP+'/ws/rest/1002/callIRAdapter/GetDocument';
            $.when(this.transferOws(docUrl)).done(function(data){
                APP.docList=data.results?data.results:[];
            })
        },


        //��ս�������չ
        sortProgress:function(list){
            var list=JSON.stringify(list);
            list=JSON.parse(list);
            let listSort=[
                {
                    task_status:3,
                    task_complete_count:0,
                    task_time_out_count:0,
                    task_type:'���Ϸ���',
                    task_count:0
                },
                {
                    task_status:3,
                    task_complete_count:0,
                    task_time_out_count:0,
                    task_type:'EOMS�ɵ�',
                    task_count:2
                },
                {
                    task_status:3,
                    task_complete_count:0,
                    task_time_out_count:0,
                    task_type:'������ս��',
                    task_count:0
                }
            ];
            let sort=['��Աȷ��','�������','����ͨ��','�����ռ�','������λ','�����ƶ�','GIS��Դ����','����ʵʩ','�ָ�ȷ��'];
            for(var i=0;i<sort.length;i++){
                for(var j=0;j<list.length;j++){
                    if(list[j].task_type==sort[i]){
                        listSort.push(list[j]);
                        list.splice(j,1);
                        break;
                    }
                }
            }
            return listSort;

        },



        //�������������������ײ�
        boardBottom:function(){
            var boardHeight=$('.bulletin-board .block-content').height();
            setTimeout(function(){
                var containerHeight=$('.board-container').height();
                if(containerHeight > boardHeight){
                    var height=parseInt(containerHeight - boardHeight) + 40,
                        i=0;
                    var scroll=setInterval(function(){
                        if(i>=height){
                            i=height;
                            $('.bulletin-board .block-content').scrollTop(i);
                            clearInterval(scroll);
                            return;
                        }
                        $('.bulletin-board .block-content').scrollTop(i);
                        i+=5;
                    },200)

                }
            },500);

        },


        //��Ƶ����
        startTSDK: function (options, account) {
            cloudEC.configure(options);
            var listeners = {
                onConfIncoming: function (ret) {
                    var con_ret = confirm("You have a incoming conference, reject or accept?");
                    if (con_ret === true) {
                        client.answerConference(true)
                    } else {
                        client.answerConference(false)
                    }
                },
                onError: function (ret) {
                    console.error(JSON.stringify(ret))
                    if (390000003 == ret.info.errorCode) {
                        console.warn(JSON.stringify(ret));
                    } else {
                        console.log(JSON.stringify(ret));
                    }
                },
                onAsOnSharingState:function(ret){
                    if(ret.result){
                        var ele=$('#cloudec-datacanvas');
                        if(ret.info.state==1){
                            ele.css('z-index',1000);
                            return;
                        }
                        ele.css('z-index',-1000);
                    }
                }
            };
            window.client = cloudEC.createClient(listeners);
            setTimeout(function () {
                this.loginCloudLink(client, account);
            }.bind(this), 5000);
        },
        loginCloudLink: function (client, account,joinCon) {
            var proxyParam = {
                proxyAddress: '',
                proxyPort: '',
                proxyAccount: '',
                proxyPassword: ''
            };
            client.login(0,
                {account: account.account, passwd: account.passwd},
                {
                    serverAddress: account.serverAddress,
                    serverPort: account.serverPort,
                    extensions: JSON.stringify(proxyParam)
                },
                function callBack(evt) {

                    if (!evt.result) {
                        console.log("login failed >>>errorCode:" + evt.info.errorCode + "errorInfo:" + evt.info.errorInfo);
                    } else {
                        $('.conference-button').show();
                        loginFlag=true;
                    }
                }.bind(this))
        },
        getConfId:function(){
            $.ajax({
                url:'https://'+soketIP+'/ReportService/BigScreen/GetHttpsRequestMessageAsync',
                dataType:'json',
                type:'get',
                data:{
                    url:'https://'+owsIP+'/ws/rest/1002/callIRAdapter/v1/war_room_conference?war_room_id='+WarRoomId

                },
                success:function(data){
                    var data=JSON.parse(data.data);
                    if(data.total>0){
                        $('.conference-button').show();
                        var conId=data.results[0].conference_id;
                        this.getConfParam(conId);
                    }
                    return false;
                }.bind(this)
            })
        },
        getConfParam:function(confId){
            if(confId){
                client.getMyConfInfo(confId, function (ret) {
                    if(ret.info){
                        var defaultPsw = "******";
                        var confPsw = ret.info.chairmanPasswd
                        if (confPsw == defaultPsw || confPsw == "") {
                            confPsw = ret.info.generalPasswd
                        }
                        var joinConfParam = {
                            conferenceId: ret.info.conferenceID,
                            accessNumber: ret.info.accessNumber,
                            confPasswd: confPsw
                        };
                        this.joinConf(joinConfParam);
                    }
                    return false;
                }.bind(this));
            }
            return false;
        },
        joinConf:function(joinConfParam){
            console.log(joinConfParam);
            if(joinConfParam){
                client.joinConference(joinConfParam, function (ret) {
                    client.setConfMode(1);
                    if(ret){
                        $('.conference-button').attr('data-switch','off').children('img').attr('src','./img/exitConf.png').next().html('�˳�����')

                        joinConFlag=true;
                    }
                    return ret;
                })
            }
            console.log('join conference failed');
        },
        leaveConference:function(){
            if (joinConFlag) {
                client.leaveConf();
            }
        },


        //�������Զ��������ײ�
        autoScroll:function(ele){
            var child=ele.children().children()
            var height=child.height()*child.length+40;
            var scrollTop=ele.scrollTop();
            if(scrollTop<height){
                ele.scrollTop(height);
            }
        },


        //��Ա�б�
        handlePerson:function(data){
            let ret=data[0].results;
            let list=new Object();
            $.each(ret,function(intex,item){
                if(!list[item.war_role]){
                    list[item.war_role]=new Array();
                }
                list[item.war_role].push({UserName:item.fullname});
            });
            APP.accountTree=list;
        },

        //���������ݴ���
        chatParse:function(chatInfo,basicTime){
            $.each(chatInfo,function(index,item){
                let oldTime=index==0?basicTime:chatInfo[index-1].showTime;
                let newTime=new Date(new Date(oldTime).getTime()+item.time*1000);
                let y=newTime.getFullYear();
                let m=newTime.getMonth()+1;
                let d=newTime.getDate();
                let h=newTime.getHours();
                let mi=newTime.getMinutes();
                let s=newTime.getSeconds();
                let actualTime=y+'-'+(m+100+'').slice(1)+'-'+(d+100+'').slice(1)+' '+(h+100+'').slice(1)+':'+(mi+100+'').slice(1)+':'+(s+100+'').slice(1);
                item.showTime=actualTime;
            });
            return chatInfo;
        },



        netFlag: function (list) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].TaskType == 'GIS��Դ����' && (list[i].TaskStatus == '�����'|| list[i].TaskStatus == '���')) {
                    return true;
                }
            }
            return false;
        },
        performanceFlag: function (list) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].TaskType == '����ʵʩ' && (list[i].TaskStatus == '�����'|| list[i].TaskStatus == '���')) {
                    return true;
                }
            }
            return false;
        },




        changeNetStatus:function(list){
            for(var i=0;i<list.net.length;i++){
                list.net[i].status=='abnormal'&&(list.net[i].status='normal');
            }
            return list;
        },


        randomNum: function (min, max, decimal) {
            if (decimal) {
                return Number((Math.random() * (max - min + 1) + min).toFixed(decimal));
            }
            return parseInt(Math.random() * (max - min + 1) + min);
        },
        splitTime: function (start, end, splitNumber, getLength) {
            if (start > end) {
                return;
            }
            var startSplit = start.split(':');
            var endSplit = end.split(':');
            var diff = parseInt(endSplit[0] * 60) + parseInt(endSplit[1]) - parseInt(startSplit[0] * 60) - parseInt(startSplit[1]);
            var length = parseInt(diff / splitNumber);
            if (getLength) {
                return length;
            }
            var timeArr = [];
            var sec = parseInt(startSplit[1] / splitNumber) * splitNumber, hour = parseInt(startSplit[0]);
            for (var i = 0; i < length; i++) {
                sec += splitNumber;
                if (sec >= 60) {
                    sec = 0;
                    hour++;
                }
                timeArr[i] = (hour + 100 + '').slice(1) + ':' + (sec + 100 + '').slice(1);
            }
            return timeArr;
        },
        randomY: function (flag) {
            var current = new Date();
            var currentTime = current.getHours() + ':' + current.getMinutes();
            var length = this.splitTime('00:00', currentTime, 5, true);
            var yArr = [];
            if (flag) {
                for (var i = 0; i < length; i++) {
                    if (i == length - 1) {
                        yArr.push(this.randomNum(50, 60));
                    } else {
                        yArr.push(this.randomNum(90, 95));
                    }
                }
            } else {
                for (var i = 0; i < length; i++) {
                    yArr.push(this.randomNum(95, 100));
                }
            }
            return yArr;
        },
        accountTree: function (accounts) {
            var tree = {};
            for (var i = 0; i < accounts.length; i++) {
                if (!tree[accounts[i].WarRole]) {
                    tree[accounts[i].WarRole] = [];
                }
                tree[accounts[i].WarRole].push({UserName: accounts[i].UserName, GroupId: accounts[i].GroupId});
            }
            return tree;
        },




        networkArr:function(data){
            var arr=new Array();
            $.each(data,function(index,item){
                arr.indexOf(item.network)==-1&&arr.push(item.network);
            })
            return arr;
        },
        getTimeLength:function(time){
            return parseInt(Math.abs(new Date().getTime()-new Date(time).getTime())/1000/60);
        }
    }
    return tools;
})