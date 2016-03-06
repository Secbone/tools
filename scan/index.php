<?php
function getIP() {
if (@$_SERVER["HTTP_X_FORWARDED_FOR"])
$ip = $_SERVER["HTTP_X_FORWARDED_FOR"];
else if (@$_SERVER["HTTP_CLIENT_IP"])
$ip = $_SERVER["HTTP_CLIENT_IP"];
else if (@$_SERVER["REMOTE_ADDR"])
$ip = $_SERVER["REMOTE_ADDR"];
else if (@getenv("HTTP_X_FORWARDED_FOR"))
$ip = getenv("HTTP_X_FORWARDED_FOR");
else if (@getenv("HTTP_CLIENT_IP"))
$ip = getenv("HTTP_CLIENT_IP");
else if (@getenv("REMOTE_ADDR"))
$ip = getenv("REMOTE_ADDR");
else
$ip = "Unknown";
return $ip;
}
$youip=getIP(); // 获取本机IP地址
if(@$_POST["remoteip"])
	$remoteip=gethostbyname($_POST["remoteip"]); // 获取表单提交的IP地址
?>
<html>
<head>
<title>在线端口扫描&mdash;&mdash;2nd丶骨頭</title>
<meta charset="utf-8">
<script type="text/javascript" src="//cdn.bootcss.com/jquery/1.9.1/jquery.min.js"></script>
<style TYPE="text/css">
<!--
TD {
	FONT-SIZE: 12px;
	FONT-FAMILY: Verdana;
	color:#000000;
	line-height: 14px;
}

table{
	margin: 0 auto;
}
	body{
		background-color: black;
		font-family:宋体,微软雅黑,Arial,Verdana,arial,serif；
	}
	@keyframes fadeIn {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
	@-webkit-keyframes fadeIn {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
	@-moz-keyframes fadeIn {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
	@-ms-keyframes fadeIn {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
	@-o-keyframes fadeIn {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
	@-webkit-keyframes title{
		0%{-webkit-transform:skew(0deg)}
		5%{-webkit-transform:skew(0deg)}
		5.2%{-webkit-transform:skew(85deg)}
		5.4%{-webkit-transform:skew(0deg)}
		25.6%{-webkit-transform:skew(0deg)}
		25.8%{-webkit-transform:skew(90deg)}
		26%{-webkit-transform:skew(0deg)}
		26.2%{-webkit-transform:skew(0deg)}
		26.4%{-webkit-transform:skew(85deg)}
		26.6%{-webkit-transform:skew(0deg)}
		100%{-webkit-transform:skew(0deg)}
	}
	@-moz-keyframes title{
		0%{-moz-transform:skew(0deg)}
		5%{-moz-transform:skew(0deg)}
		5.2%{-moz-transform:skew(85deg)}
		5.4%{-moz-transform:skew(0deg)}
		25.6%{-moz-transform:skew(0deg)}
		25.8%{-moz-transform:skew(90deg)}
		26%{-moz-transform:skew(0deg)}
		26.2%{-moz-transform:skew(0deg)}
		26.4%{-moz-transform:skew(85deg)}
		26.6%{-moz-transform:skew(0deg)}
		100%{-moz-transform:skew(0deg)}
	}
	@-ms-keyframes title{
		0%{-ms-transform:skew(0deg)}
		5%{-ms-transform:skew(0deg)}
		5.2%{-ms-transform:skew(85deg)}
		5.4%{-ms-transform:skew(0deg)}
		25.6%{-ms-transform:skew(0deg)}
		25.8%{-ms-transform:skew(90deg)}
		26%{-ms-transform:skew(0deg)}
		26.2%{-ms-transform:skew(0deg)}
		26.4%{-ms-transform:skew(85deg)}
		26.6%{-ms-transform:skew(0deg)}
		100%{-ms-transform:skew(0deg)}
	}
	@-o-keyframes title{
		0%{-o-transform:skew(0deg)}
		5%{-o-transform:skew(0deg)}
		5.2%{-o-transform:skew(85deg)}
		5.4%{-o-transform:skew(0deg)}
		25.6%{-o-transform:skew(0deg)}
		25.8%{-o-transform:skew(90deg)}
		26%{-o-transform:skew(0deg)}
		26.2%{-o-transform:skew(0deg)}
		26.4%{-o-transform:skew(85deg)}
		26.6%{-o-transform:skew(0deg)}
		100%{-o-transform:skew(0deg)}
	}
	@keyframes title{
		0%{transform:skew(0deg)}
		5%{transform:skew(0deg)}
		5.2%{transform:skew(85deg)}
		5.4%{transform:skew(0deg)}
		25.6%{transform:skew(0deg)}
		25.8%{transform:skew(90deg)}
		26%{transform:skew(0deg)}
		26.2%{transform:skew(0deg)}
		26.4%{transform:skew(85deg)}
		26.6%{transform:skew(0deg)}
		100%{transform:skew(0deg)}
	}

	.title{
		margin: 20px auto 100px;
		font-weight: bolder;
		font-size: 70px;
		color: #0f0;
		text-align: center;
		width: 600px;
		text-shadow: 0 0 45px #0f0;
		-webkit-animation: title 30s infinite;
		-moz-animation: title 30s infinite;
		-ms-animation: title 30s infinite;
		-o-animation: title 30s infinite;
		animation: title 30s infinite;
	}
	.scan_box{
		margin:0 auto;
		text-align: center;
		color:black;
		font-weight: bold;
		height: 300px;
		width: 600px;
		border-radius: 10px;
		box-shadow: 0 0 40px #0f0;
	}
	.scan_content_box{
		padding: 20px;
		height: 260px;
		width: 560px;
		border-radius: 10px;
		box-shadow: 0 0 15px #0f0 inset;
		background-color: white;
	}
	.scan_content_box .scan_title{
		font-size: 14px;
		font-weight: bold;
		color:#777;
	}
	.scan_content_box .scan_title span{
		color: #222;
	}
	.scan_content_box .scan_content{
		overflow: hidden;
		zoom:1;
		margin-top: 80px;
		text-align: left;
	}
	.scan_content_box .scan_content input{
		margin: 15px 50px;
		border: 0;
		border-radius: 5px;
		box-shadow: 0 0 10px #0f0;
	}
	.scan_content_box .scan_content .ip_box{
		float: left;
		margin-right: 0;
	}
	.scan_content_box .scan_content .scan_btn{
		float: right;
		margin-right: 70px;
		margin-left: 0;
		background-color: #0f0;
		color: white;
		font-weight: bold;
		font-size: 10px;
	}
	.line_box{
		position:absolute;
		top: -200px;
		margin: 0 auto;
		width: 600px;
		height: 100px;
	}
	.line_box .left_line{
		float: left;
		height: 100%;
		width: 0;
		background-color: lime;
		border-left:2px lime solid;
		border-right:2px lime solid;
		border-radius: 3px;
		box-shadow: 0 0 10px lime;
	}
	.line_box .right_line{
		float: right;
		height: 100%;
		width: 0;
		background-color: lime;
		border-left:2px lime solid;
		border-right:2px lime solid;
		border-radius: 3px;
		box-shadow: 0 0 10px lime;
	}
	.result_box{
		margin: 0 auto;
		width: 550px;
	}
	.result_box .scan_ip_box{
		margin-bottom:50px;
		text-align: center;
		color: white;
		font-size: 12px;
		font-weight: bold;
		text-shadow: 0 0 3px white;
	}
	.result_box .scan_ip_box .span_ip{
		font-size: 14px;
		color: lime;
		text-shadow: 0 0 3px white;
	}
	.result_box .result_title{
		overflow: hidden;
		zoom:1;
		margin: 0 auto 50px;
		padding: 5px 10px;
		text-align: center;
		font-size: 14px;
		font-weight: bold;
		color: white;
		width: 500px;
		background-color: lime;
		border-radius: 5px;
		box-shadow: 0 0 10px lime;
	}
	.result_box .result_title div{
		float: left;
	}
	.result_box .result_title .port{
		width: 60px;
	}
	.result_box .result_title .service{
		width: 140px;
	}
	.result_box .result_title .result_text{
		width: 80px;
	}
	.result_box .result_title .description{
		width: 220px;
	}
	.result_box .result_line{
		overflow: hidden;
		zoom:1;
		margin: 5px auto;
		padding: 5px 10px;
		text-align: center;
		font-size: 14px;
		font-weight: bold;
		color: white;
		width: 500px;
		text-shadow: 0 0 3px white;
		animation-name: fadeIn;
		animation-duration: 3s;
		animation-iteration-count: 1;
		animation-delay: 0s;
		-webkit-animation-name: fadeIn;
		-webkit-animation-duration: 3s;
		-webkit-animation-iteration-count: 1;
		-webkit-animation-delay: 0s;
		-moz-animation-name: fadeIn;
		-moz-animation-duration: 3s;
		-moz-animation-iteration-count: 1;
		-moz-animation-delay: 0s;
		-ms-animation-name: fadeIn;
		-ms-animation-duration: 3s;
		-ms-animation-iteration-count: 1;
		-ms-animation-delay: 0s;
		-o-animation-name: fadeIn;
		-o-animation-duration: 3s;
		-o-animation-iteration-count: 1;
		-o-animation-delay: 0s;
	}
	.result_box .result_line_open{
		color: lime;
		text-shadow: 0 0 3px lime;
	}
	.result_box .result_line div{
		float: left;
	}
	.result_box .result_line .port{
		width: 60px;
	}
	.result_box .result_line .service{
		width: 140px;
	}
	.result_box .result_line .result_text{
		width: 80px;
	}
	.result_box .result_line .description{
		width: 220px;
	}
	.result_box .return_btn{
		display: block;
		text-decoration: none;
		margin: 50px auto 400px;
		padding: 5px 10px;
		text-align: center;
		font-size: 14px;
		font-weight: bold;
		color: white;
		width: 500px;
		background-color: lime;
		border-radius: 5px;
		box-shadow: 0 0 10px lime;
	}
-->
</style>
</head>
<body>
<?php
if (!empty($remoteip)){
// 如果表单不为空就进入IP地址格式的判断

function err() {
die("<div style='color:#0f0;margin:10px auto;text-align:center;'>对不起，该IP地址不合法<p><a href=javascript:history.back(1)>点击这里返回</a></div>");
}
// 定义提交错误IP的提示信息
function port_msg($port){
	switch($port){
		case 21:
			return 'Ftp';
		case 22:
			return 'Ssh';
		case 23:
			return 'Telnet';
		case 25:
			return 'Smtp';
		case 47:
			return 'Gre';
		case 79:
			return 'Finger';
		case 80:
			return 'Http';
		case 110:
			return 'Pop3';
		case 135:
			return 'Location Service';
		case 137:
			return 'Netbios-NS';
		case 138:
			return 'Netbios-DGM';
		case 139:
			return 'Netbios-SSN';
		case 143:
			return 'IMAP';
		case 443:
			return 'Https';
		case 445:
			return 'Microsoft-DS';
		case 1080:
			return 'SOCKS';
		case 1433:
			return 'MSSQL';
		case 1521:
			return 'Oracle';
		case 1723:
			return 'PPTP';
		case 3306;
			return 'MYSQL';
		case 3389:
			return 'Terminal Services';
		case 7001:
			return 'WebLogic';
		default:
			return 'Unknown';
	}
}

if($remoteip == "127.0.0.1") err();
//本地回环，提示错误

$ips=explode(".",$remoteip);
// 用.分割IP地址

if (intval($ips[0])<1 or intval($ips[0])>255 or intval($ips[3])<1 or intval($ips[3]>255)) err();
// 如果第一段和最后一段IP的数字小于1或者大于255，则提示出错

if (intval($ips[1])<0 or intval($ips[1])>255 or intval($ips[2])<0 or intval($ips[2]>255)) err();
// 如果第二段和第三段IP的数字小于0或者大于255，则提示出错
$port = explode(",",$_POST["remoteport"]);
$port = array_unique($port);
$closed='此端口目前处于关闭状态。';
$opened='此端口目前处于打开状态！';
$close="关闭";
$open="打开";
//$port=array(21,23,25,79,80,110,135,137,138,139,143,443,445,1433,3306,3389);
$msg=array(
'Ftp',
'Telnet',
'Smtp',
'Finger',
'Http',
'Pop3',
'Location Service',
'Netbios-NS',
'Netbios-DGM',
'Netbios-SSN',
'IMAP',
'Https',
'Microsoft-DS',
'MSSQL',
'MYSQL',
'Terminal Services'
);
set_time_limit(0);
echo '<script>
	$(function(){
		$(window).scroll(line_scroll);
		$(".line_box").css("left",$(window).width()/2-300+"px");
		$(".line_box").animate({top:"350px"},1000);
		s_top = $(".line_box").offset().top;
	});
	function line_scroll(){
		$(".line_box").animate({top: $(window).scrollTop()+350+"px" },{queue:false,duration:500});
	}
</script>';
echo '<div class="line_box"><div class="left_line"></div><div class="right_line"></div></div>';
echo '<div class="title">在线端口扫描</div>';
echo '<div class="result_box">
			<div class="scan_ip_box">您扫描的IP：<span class="span_ip">'.$remoteip.'</span></div>
			<div class="result_title">
				<div class="port">端口</div>
				<div class="service">服务</div>
				<div class="result_text">检查结果</div>
				<div class="description">描述</div>
			</div>';
ob_flush();
flush();
for($i=0;$i<sizeof($port);$i++)
{
	$fp = @fsockopen($remoteip, $port[$i], &$errno, &$errstr, 1);
	if (!$fp) {
		echo '<div class="result_line">
				<div class="port">'.$port[$i].'</div>
				<div class="service">'.port_msg($port[$i]).'</div>
				<div class="result_text">'.$close.'</div>
				<div class="description">'.$closed.'</div>
			</div>';
		ob_flush();
		flush();
	} else {
		echo '<div class="result_line result_line_open">
				<div class="port">'.$port[$i].'</div>
				<div class="service">'.port_msg($port[$i]).'</div>
				<div class="result_text">'.$open.'</div>
				<div class="description">'.$opened.'</div>
			</div>';
		ob_flush();
		flush();
	}
}
echo '<a href="/" class="return_btn">继续扫描</a>
		</div>';
/***************旧版***********
// 通过IP格式的检查后用数组定义各端口对应的服务名称及状态
echo "<table border=0 cellpadding=15 cellspacing=0>\n";
echo "<tr>\n";
echo "<td align=center><strong><font color=#FFFFFF>您扫描的IP：</font><font
color=red>".$remoteip."</font></strong></td>\n";
echo "</tr>\n";
echo "</table>\n";
echo "<table cellpadding=5 cellspacing=1 bgcolor=#636194>\n";
echo "<tr bgcolor=#7371A5 align=center>\n";
echo "<td><span class=style1>端口</span></td>\n";
echo "<td><span class=style1>服务</span></td>\n";
echo "<td><span class=style1>检测结果</span></td>\n";
echo "<td><span class=style1>描述</span></td>\n";
echo "</tr>\n";
// 输出显示的表格
ob_flush();
flush();
for($i=0;$i<sizeof($port);$i++)
{
$fp = @fsockopen($remoteip, $port[$i], &$errno, &$errstr, 1);
if (!$fp) {
echo "<tr bgcolor=#FFFFFF><td align=center>".$port[$i]."</td><td>".port_msg($port[$i])."</td><td
align=center>".$close."</td><td>".$closed."</td></tr>\n";
ob_flush();
flush();
} else {
echo "<tr bgcolor=#F4F7F9><td align=center><font color=red>".$port[$i]."</font></td><td><font color=red>".port_msg($port[$i])."</font></td><td
align=center>".$open."</td><td>".$opened."</td></tr>";
ob_flush();
flush();
}
}
// 用for语句，分别用fsockopen函数连接远程主机的相关端口，并输出结果

echo "<tr><td colspan=4 align=center>\n";
echo "<a href=scan.php><font color=#FFFFFF>继续扫描>>></font></a></td>\n";
echo "</tr>\n";
echo "</table>\n";
*/
}
// 探测结束
else {
/************************旧版******************************/
/*echo "<table border=0 cellpadding=15 cellspacing=0>\n";
echo "<tr>\n";
echo "<td align=center><strong><font color=#FFFFFF>您的IP：</font><font color=#00ff00>".$youip."</font></strong></td>\n";
echo "</tr>\n";
echo "<form method=POST>\n";
echo "<tr><td align=center>\n";
echo "<input type=text name=remoteip size=12>\n";
echo "<input type=submit value=扫描 name=scan>\n";
echo "</td></tr>\n";
echo "<tr><td><input type=text name=remoteport size=80 value='21,23,25,79,80,110,135,137,138,139,143,443,445,1433,3306,3389'></td></tr>";
echo "</form>\n";
echo "</table>\n";*/
/**********************end**********************************/

echo '<div class="title">在线端口扫描</div>';
echo '<div class="scan_box">';
echo '<div class="scan_content_box">';
echo '<div class="scan_title">';
echo '您的IP：<span>'.$youip.'</span>';
echo '</div>';
echo '<div class="scan_content">';
echo '<form method="POST">';
echo '<input type="text" name="remoteip" size="30"/>';
echo '<input class="scan_btn" type="submit" value="扫描" name="scan"/><br/>';
echo '<input type="text" name="remoteport" style="width:450px" value="21,22,23,25,79,80,110,135,137,138,139,143,443,445,1433,3306,3389"/>';
echo '</form>';
echo '</div>';
echo '</div>';
echo '</div>';
// 如果表单为空则显示提交IP地址的表单
}
?>
</body>
</html>
