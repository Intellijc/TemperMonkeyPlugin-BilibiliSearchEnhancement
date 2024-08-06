**插件介绍**

    实现以下功能:
1. 筛选日期范围内发布的视频
2. 筛选掉播放量少于()的视频
3. 根据(播放,点赞比) ,(播放,投币比),(播放,收藏比)等条件排序视频结果 
4. 结合原本的搜索条件,如分区,视频时长综合筛选 
5. 除了投币,同样的搜索方式套用到专栏上
6. 无缝翻页
7. 根据标题中的关键词去掉视频
8. 根据简介中的关键词去掉视频
---
## 7.26 - 创建仓库,选择开源协议GPL3.0,开始研究他人代码
1. Bilibili搜索页面筛选增强脚本，增加今年、本月、当日发布筛选，可配合B站原有的综合排序、最多点击、最多弹幕、最多收藏使用。
https://greasyfork.org/zh-CN/scripts/468336-bilibili%E7%AD%9B%E9%80%89%E5%A2%9E%E5%BC%BA/code 


2. add time filter to bilibili search results
https://greasyfork.org/en/scripts/448716-bilibili-search-filter-by-time


3. bilibili官方api
https://github.com/SocialSisterYi/bilibili-API-collect


4. 时光机app,调用b站api
https://github.com/10miaomiao/bilimiao2/tree/master

---
## 7.31 实现基础功能之**根据投币播放比排序搜索首页结果** - 版本号: v1.0

无缝翻页功能最后做 因为大部分有效搜索结果都在前面

开发:筛选日期内发布的视频功能实现

想法: 用户在看完视频后可以选择点击按钮,好或坏, 
然后脚本会爬取这个视频的信息,获取其点赞收藏播放评论市场等数据,
根据点赞率,投币率,lg时长等参数,以一个越来越小的学习率去修改我的公式中各个值的权重
[视频评分算法](https://github.com/Qonstantine/TemperMonkeyPlugin-BilibiliSearchEnhancement/blob/805/bilibili%E7%AD%9B%E9%80%89%E5%A2%9E%E5%BC%BA%E8%84%9A%E6%9C%AC/%E8%A7%86%E9%A2%91%E8%AF%84%E5%88%86%E7%AE%97%E6%B3%95.md)

---
## 8.1 开始实现按照发布时间筛选的demo

整个脚本流程: 将整个"筛选 - 排除 - 排序"流程封装成一个事务

每次改变任意搜索条件时, 首先函数1{按照要求的日期,播放量,弹幕数,uid列表进行初步筛选},然后函数2{排除播放量少于xxx视频,投币播放比低于xxx的视频等}, 
如果接下来的视频数量少于一页的量,加载下一页的card,直到排除后的结果满足一页的视频数量或不能再继续加载为止.

将刚才获取的视频信息json数组 根据[视频评分算法](https://github.com/Qonstantine/TemperMonkeyPlugin-BilibiliSearchEnhancement/blob/805/bilibili%E7%AD%9B%E9%80%89%E5%A2%9E%E5%BC%BA%E8%84%9A%E6%9C%AC/%E8%A7%86%E9%A2%91%E8%AF%84%E5%88%86%E7%AE%97%E6%B3%95.md)进行排序

发现bilibili搜索结果的card 可以获取up的uid,视频bv号,弹幕数,播放量,时长,发布时间 记录一下
为了提高筛选-排除的效率,可以先通过card的信息,排除尽可能多的信息

另外 视频评分算法应该还要另一个不排除视频的版本,这个版本的名字叫"找视频模式" 原来的版本就叫"高质量视频模式"
很多时候需要找视频的需求是很多的 比如我找视频教程的时候 可能还需要视频时长不低于20分钟 播放量不低于10000

还有就是 目前的脚本设计是默认屏蔽bilibili课堂的 想看课堂的给钱我c给你....


突然在想 如果我找到的视频是 播放投币比大的 是不是意味着这些是垃圾内容的"标题党"视频,反之是优质内容但没有优质标题的,
这样搜索会使得标题封面丑陋的视频获得过高的权重,而优质封面优质内容的视频比不过他

todo: 预筛选和正式排除算法 都要考虑到搜索的可能不是视频是:专栏,课程,番剧,直播间,主播,话题,用户,相簿,
[参考这个响应结果](https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/search/search_response.md)

使用https://api.bilibili.com/x/web-interface/wbi/search/all/v2这个接口获取搜索结果,需要wbi签名,
但是可以通过https://api.bilibili.com/x/web-interface/view?bvid=xxx  这个接口绕过wbi签名


---
## 8.2 修改后续筛选算法, 更新视频数不足自动补全功能, 视频筛选算法应用
TODO:后期更新功能: 通过up主名称 搜索up主 点击后添加入黑名单

---
## 8.5 解决搜索bilibili课堂,up主,直播,番剧,影视带来的不同卡片信息问题;整合预筛选和进一步筛选到一起,修改返回值格式
添加了一堆todo

---
## 8.6 解决发布日期错误问题,实现导入params进行评分后筛选,写回页面使用异步函数,预筛选函数添加参数,删除活动窗口,up窗口,赛事窗口,番剧窗口,影视窗口,解决删除活动窗口后无法插入的bug,为页面添加变动检测,实现刷新 搜索 点击等导致的页面刷新会重新进行排序

坑:
    return sortedVideos.map(item => item.video); 排序函数计算出score,返回的是{score,video} 返回如果是 sortedVideos.video是错的
    如果在document.querySelectorAll('[live-from]:not(.brand-ad-list)');不排除.brand-ad-list,会导致之前用xpath做的写回定位失败
    页面加载完成后,需要一定时间的延时防止获取到的herf信息为空

