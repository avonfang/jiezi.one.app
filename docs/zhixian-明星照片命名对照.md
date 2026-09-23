# 仙人指路 · 明星照片命名对照表

> 把授权照片按下面的**文件名**命名，放进 `D:\创业项目\10.仙人指路\docs\photos\` 目录，再告诉模型「放好了」，即可批量入库。

## 照片要求
- 单人、正面、清晰，脸部无遮挡；
- 建议宽度 ≥ 500px，JPEG / PNG 均可；
- 每人 1 张即可（也可多张，但文件名需加序号，如 `shen_teng-1.jpg`）。

## 文件名对照（30 位）

| 文件名 | 姓名 | 风格标签 |
|---|---|---|
| `shen_teng.jpg` | 沈腾 | 喜剧松弛系 |
| `ma_li.jpg` | 马丽 | 御姐气场系 |
| `lei_jiayin.jpg` | 雷佳音 | 憨厚随和系 |
| `yue_yunpeng.jpg` | 岳云鹏 | 喜感圆润系 |
| `jia_ling.jpg` | 贾玲 | 亲切感染力 |
| `sha_yi.jpg` | 沙溢 | 中年幽默系 |
| `bai_ke.jpg` | 白客 | 丧萌颓帅系 |
| `huang_bo.jpg` | 黄渤 | 市井精明系 |
| `xu_zheng.jpg` | 徐峥 | 中年幽默系 |
| `wang_baoqiang.jpg` | 王宝强 | 憨直草根系 |
| `da_peng.jpg` | 大鹏 | 草根逆袭系 |
| `qiao_shan.jpg` | 乔杉 | 东北搞笑系 |
| `chang_yuan.jpg` | 常远 | 一本正经搞笑系 |
| `ai_lun.jpg` | 艾伦 | 傻大个憨憨系 |
| `wei_xiang.jpg` | 魏翔 | 冷面喜剧系 |
| `wang_xun.jpg` | 王迅 | 憨精小人物系 |
| `pan_binlong.jpg` | 潘斌龙 | 喜庆老实系 |
| `song_xiaobao.jpg` | 宋小宝 | 夸张喜剧系 |
| `xiao_shenyang.jpg` | 小沈阳 | 乡土喜感系 |
| `wen_song.jpg` | 文松 | 娘萌反差系 |
| `yang_di.jpg` | 杨迪 | 表情包系 |
| `jin_jing.jpg` | 金靖 | 疯癫少女系 |
| `lamu_yangzi.jpg` | 辣目洋子 | 自信搞笑系 |
| `jiang_long.jpg` | 蒋龙 | 中二热血系 |
| `zhang_chi.jpg` | 张弛 | 冷幽默系 |
| `da_suo.jpg` | 大锁 | 丧系吐槽系 |
| `tu_dou.jpg` | 土豆 | 无厘头系 |
| `lv_yan.jpg` | 吕严 | 憨憨直男系 |
| `hu_lan.jpg` | 呼兰 | 理工幽默系 |
| `pang_bo.jpg` | 庞博 | 阳光理工系 |

## 入库后验证
模型会执行：批量 `CreatePerson` → 用每张图 `SearchFaces` 自测 → 重启本地 dev，确认各明星都能命中本人。
