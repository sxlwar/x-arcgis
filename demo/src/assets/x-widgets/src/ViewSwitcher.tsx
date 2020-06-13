/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import { declared, property, subclass } from 'esri/core/accessorSupport/decorators';
import * as watchUtils from 'esri/core/watchUtils';
import { renderable, tsx } from 'esri/widgets/support/widget';

import Widget = require('esri/widgets/Widget');
import MapView = require('esri/views/MapView');

import esri = __esri;

tsx;

@subclass('esri.widgets.ViewSwitcher')
class ViewSwitcher extends declared(Widget) {
  @property()
  @renderable()
  view: MapView | esri.SceneView;

  @property()
  @renderable()
  type = '2d';

  constructor() {
    super();
    this._onClick = this._onClick.bind(this);
  }

  render() {
    return (
      <button
        class="esri-component esri-widget--button esri-widget esri-interactive"
        id="view-switcher"
        onclick={this._onClick}
      >
        {this.type === '2d' ? '3D' : '2D'}
      </button>
    );
  }

  postInitialize() {
    watchUtils.init(this, 'view.type', () => {
      this.type = this.view.type || '3d';
    });
  }

  private _onClick() {
    this.type = this.type === '2d' ? '3d' : '2d';
  }
}

export = ViewSwitcher;
