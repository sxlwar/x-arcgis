# Usage

## 地图

1. import XArcgisModule

```ts
import { XArcgisModule} from 'x-arcgis';

// module
@ngModule({
    imports: [XArcgisModule]
})
```

2. 在需要显示地图的组件模板中使用组件

```html
<x-arcgis-map></x-arcgis-map>
```

## 其它部件

1. 部件的 UI 可以根据项目的需要使用不同的 UI 框架定义，如 ng-zorro，material 等。

x-arcgis 将在对应的位置显示定义好的部件

2. 部件的 UI 部分定义好之外，还需要告诉 x-arcgis 如何处理相应的事件，也就是需要传入一个事件源，事件源全部以 Observable 的形式传入，这样 x-arcgis 在接收到相应的事件后将自动处理接下来的所有步骤。

3. 如果只定义 UI 但是没有给 x-arcgis 传入相应事件源时，此部件将不会在地图上显示。以画图组件为例

```html
<x-arcgis-map [onDraw]="draw.valueChanges">
  <!-- 触发画图事件的模板 -->
  <nz-radio-group [formControl]="draw" [nzSize]="'default'" [nzButtonStyle]="'solid'" x-arcgis-draw-toolbar>
    <label nz-radio-button nzValue="point">
      <i nz-icon nzType="dot-chart" nzTheme="outline"></i>
      <span>点</span>
    </label>
    <label nz-radio-button nzValue="polyline">
      <i nz-icon nzType="fund" nzTheme="outline"></i>
      <span>线</span>
    </label>
    <label nz-radio-button nzValue="polygon">
      <i nz-icon nzType="area-chart" nzTheme="outline"></i>
      <span>区域</span>
    </label>
  </nz-radio-group>
</x-arcgis-map>
```

```ts

@Component({...})
class MapDemoComponent {
  // 使用它的valueChanges 作触发画图的事件源
  draw: FormControl = new FormControl('');
}

```

## DISCUSS

树形结构上的元素点击时，需要显示后台表单，表单字段就需要动态渲染。此外还需要知道此节点关联在地图上的layer信息（类型，id）等
