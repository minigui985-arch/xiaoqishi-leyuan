# 小骑士乐园角色多视角设定

现已覆盖儿童／成人、十字军／明军的六类棋子，共 24 个角色版本。本轮补齐 20 个版本，儿童国王和皇帝另有校正版 v2，初稿留作对照。打开 [图纸总览](index.html) 可点击放大全部选定图纸。图纸是**建模参考**，尚未制作为可旋转的 3D 模型或接入游戏。人物图展示正面、侧面、背面、三分之四角度及表情参考；要塞、火炮展示结构细节。参考图中的装备、朝代特征与阵营颜色须在建模时复核。

| 版本 | 十字军兵 | 明军兵 |
| --- | --- | --- |
| 儿童 Q 版 | [child-crusader-pawn-v1.png](child-crusader-pawn-v1.png) | [child-ming-pawn-v1.png](child-ming-pawn-v1.png) |
| 成人版 | [adult-crusader-pawn-v1.png](adult-crusader-pawn-v1.png) | [adult-ming-pawn-v1.png](adult-ming-pawn-v1.png) |

| 棋种 | 儿童十字军 | 成人十字军 | 儿童明军 | 成人明军 |
| --- | --- | --- | --- | --- |
| 车 | [要塞](child-crusader-rook-v1.png) | [要塞](adult-crusader-rook-v1.png) | [红衣大炮](child-ming-rook-v1.png) | [红衣大炮](adult-ming-rook-v1.png) |
| 马 | [骑士](child-crusader-knight-v1.png) | [骑士](adult-crusader-knight-v1.png) | [骑兵](child-ming-knight-v1.png) | [骑兵](adult-ming-knight-v1.png) |
| 象 | [主教](child-crusader-bishop-v1.png) | [主教](adult-crusader-bishop-v1.png) | [文臣](child-ming-bishop-v1.png) | [文臣](adult-ming-bishop-v1.png) |
| 后 | [王后](child-crusader-queen-v1.png) | [王后](adult-crusader-queen-v1.png) | [皇后](child-ming-queen-v1.png) | [皇后](adult-ming-queen-v1.png) |
| 王 | [国王 v2](child-crusader-king-v2.png) | [国王](adult-crusader-king-v1.png) | [皇帝 v2](child-ming-king-v2.png) | [皇帝](adult-ming-king-v1.png) |

造型沿用现有 `FACTIONS`：车是十字军要塞／明军红衣大炮，不强行加人脸；马同时包含骑手和战马。成人版保留成熟比例，儿童版保留圆润 Q 版比例，不交换两阵营的服饰、武器和纹样。儿童皇帝 v2 修正了与文臣混淆的水平帽翼；儿童国王 v2 恢复米白金边王袍。生成方式与逐图完整提示词记录在 [generation-manifest.json](generation-manifest.json)。

## 分层制作要求（待实际制作）

| 角色 | 单独制作的部件 |
| --- | --- |
| 步兵／火铳手 | 头盔、头脸、眉眼、嘴、躯干、双臂、腿、剑／火铳、盾、底座 |
| 要塞 | 主塔、侧塔、城门、城垛、旗杆、旗面、底座 |
| 火炮 | 炮管、炮架、双轮、轮轴、引信、烟效、底座 |
| 骑士／骑兵 | 骑手身体与面部、武器、披风；战马身体、头颈、四肢、鬃尾、马具、底座 |
| 主教／文臣 | 帽冠、头脸、胡须、眉眼、嘴、躯干、双臂、袍摆、牧杖／经书／笏板、底座 |
| 王后／皇后 | 冠饰与垂珠、头发、面部、躯干、双臂、裙摆、披风／披帛、权杖／团扇、底座 |
| 国王／皇帝 | 冠帽、头发与胡须、面部、躯干、双臂、袍摆、披风、宝剑／玉圭、底座 |

PNG 中的表情是视觉参考；可编辑 PSD 分层、模型部件、骨骼、口形与表情绑定不包含在本次图纸文件内。

每个可表情的角色至少单独保留头部、眼睑与眉、口形、躯干、双臂、手持道具、披风或裙摆；可见脸部要能表达平静、欣喜、担忧。头盔遮脸时以头部转向、身体动作和语音表达状态，不为了表情破坏头盔设计。语音应与对弈状态同步且可静音。3D 对弈与 3D 复盘共用同一套棋局记录及合法走法，不另写棋规；现有 2D 模式保留给不支持 3D 或低性能的设备。

目前缺少原始 GLB／FBX／Blender 模型、面部绑定和用户提到的演示视频，因此这批 PNG 只适合作为造型审批与建模输入。不要把参考截图中的经典棋子或其界面直接复制进游戏。
