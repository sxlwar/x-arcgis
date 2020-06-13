/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/core/accessorSupport/decorators", "esri/core/watchUtils", "esri/widgets/support/widget", "esri/widgets/Widget"], function (require, exports, __extends, __decorate, decorators_1, watchUtils, widget_1, Widget) {
    "use strict";
    watchUtils = __importStar(watchUtils);
    widget_1.tsx;
    var ViewSwitcher = /** @class */ (function (_super) {
        __extends(ViewSwitcher, _super);
        function ViewSwitcher() {
            var _this = _super.call(this) || this;
            _this.type = '2d';
            _this._onClick = _this._onClick.bind(_this);
            return _this;
        }
        ViewSwitcher.prototype.render = function () {
            return (widget_1.tsx("button", { class: "esri-component esri-widget--button esri-widget esri-interactive", id: "view-switcher", onclick: this._onClick }, this.type === '2d' ? '3D' : '2D'));
        };
        ViewSwitcher.prototype.postInitialize = function () {
            var _this = this;
            watchUtils.init(this, 'view.type', function () {
                _this.type = _this.view.type || '3d';
            });
        };
        ViewSwitcher.prototype._onClick = function () {
            this.type = this.type === '2d' ? '3d' : '2d';
        };
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], ViewSwitcher.prototype, "view", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], ViewSwitcher.prototype, "type", void 0);
        ViewSwitcher = __decorate([
            decorators_1.subclass('esri.widgets.ViewSwitcher')
        ], ViewSwitcher);
        return ViewSwitcher;
    }(decorators_1.declared(Widget)));
    return ViewSwitcher;
});
//# sourceMappingURL=ViewSwitcher.js.map