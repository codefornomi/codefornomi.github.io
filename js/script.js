"use strict";
var ctx = null;	//l20n ADD #11 他言語化対応

//ADD START #1 地区を追加
var DistrictModel = function() {
	this.district;
}
//ADD E N D #1

/**
  エリア(ごみ処理の地域）を管理するクラスです。
*/
var AreaModel = function() {
	this.district; // ADD #1 地区を追加
	this.label;
	this.centerName;
	this.center;
	this.trash = new Array();
	/**
	 * 各ゴミのカテゴリに対して、最も直近の日付を計算します。
	 */
//	this.calcMostRect = function() {
//		for (var i = 0; i < this.trash.length; i++) {
//			//MOD START #3 代替日対応
//			//this.trash[i].calcMostRect(this);
//			this.trash[i].calcMostRect(this, null);
//			//MOD E N D#3 代替日対応
//		}
//	}
	/**
	 * 各ゴミのカテゴリに対して、最も直近の日付を計算します。
	 */
	this.calcMostRect = function(alternateDays) {
		for (var i = 0; i < this.trash.length; i++) {
			this.trash[i].calcMostRect(this, alternateDays);
		}
	}
	//MOD E N D #3 
	/**
	 * 休止期間（主に年末年始）かどうかを判定します。
	 */
	this.isBlankDay = function(currentDate) {
		if (!this.center){
			return false;
		}
		var period = [this.center.startDate, this.center.endDate];
		if (period[0].getTime() <= currentDate.getTime() 
				&&  currentDate.getTime() <= period[1].getTime()) {
			return true;
		}
		return false;
	}
	/**
	 * ゴミ処理センターを登録します。
	 * 名前が一致するかどうかで判定を行っております。
	 */
	this.setCenter = function(center_data) {
		for (var i in center_data) {
			if (this.centerName == center_data[i].name) {
				this.center = center_data[i];
			}
		}
	}
	/**
	 * ゴミのカテゴリのソートを行います。
	 */
	this.sortTrash = function() {
		this.trash.sort(function(a, b) {
			var at = a.mostRecent.getTime();
			var bt = b.mostRecent.getTime();
			if (at < bt) return -1;
			if (at > bt) return 1;
			return 0;
		});
	}
};

/**
 * #3  代替日対応
 * 代替日を管理する
 */
var AlternateDaysModel = function(district) {
	this.district = district;
	this.areaMap = new Object(); //地域マップ

	/**
	 * 数値型を0サプレスする
	 */
	function toDoubleDigit(num) {
		num +="";
		if (num.length === 1) {
			num = "0" + num;
		}
		return num;
	}
	
	/**
	 * Date型をYYYYMMDD形式の文字列に変換する
	 */
	function getKeyString (date) {
		var yyyy = date.getFullYear();
		var mm = toDoubleDigit(date.getMonth() +1);
		var dd = toDoubleDigit(date.getDate());
		return yyyy+mm+dd;
	}
	
	/**
	 * 代替日を登録する
	 * areaName:地域名
	 * trashName:ごみの種類
	 * areaDay:収集日
	 * alternateDay:代替日
	 */
	this.push = function(areaName, trashName, areaDay, alternateDay) {
		var areaObj = this.areaMap[areaName];
		if (areaObj == null) {
			areaObj = new Object();	//地域毎
		}
		var trashObj = areaObj[trashName];
		if (trashObj == null) {
			trashObj = new Object();	//ごみの種類毎
		}
		
		var alternatedate = null;
		if (alternateDay != null) {
			//Date型に変換する
			var year = parseInt(alternateDay.substr(0, 4));
			var month = parseInt(alternateDay.substr(4, 2)) - 1;
			var day = parseInt(alternateDay.substr(6, 2));
			alternatedate = new Date(year, month, day);
		}
		trashObj[areaDay] = alternatedate;
		areaObj[trashName] = trashObj;
		this.areaMap[areaName] = areaObj;
	}
	/**
	 * 代替日があるか検査する
	 * areaName:地域名
	 * trashName:ごみの種類
	 * areaDate:収集日(Date型)
	 * 戻り値: 代替日があればtrue,なければfalse
	 */
	this.hasAlternateDay = function(areaName, trashName, areaDate) {
		var areaObj = this.areaMap[areaName];
		if (areaObj == null) {
			return false;
		}
		var trashObj = areaObj[trashName];
		if (trashObj == null) {
			return false;
		}
		var areaDay = getKeyString(areaDate);
		var alternateDay = trashObj[areaDay];
		if(alternateDay == null) {
			return false;
		}
		return true;
	}
	/**
	 * 代替日を返却する
	 * areaName:地域名
	 * trashName:ごみの種類
	 * areaDay:収集日
	 * 戻り値: 代替日があれば代替日、なければnull
	 */
	this.find = function(areaName, trashName, areaDay) {
		var areaObj = this.areaMap[areaName];
		if (areaObj == null) {
			return null;
		}
		var trashObj = areaObj[trashName];
		if (trashObj == null) {
			return null;
		}
		var alternateDate = trashObj[getKeyString(areaDay)];
		return alternateDate;
	}
};

/**
  各ゴミのカテゴリを管理するクラスです。
*/
var TrashModel = function(_lable, _cell, remarks) {
	this.remarks = remarks;
	this.dayLabel;
	this.mostRecent;
	this.dayList;
	this.mflag = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
	var monthSplitFlag=_cell.search(/:/)>=0
	if (monthSplitFlag) {
		var flag = _cell.split(":");
		this.dayCell = flag[0].split(" ");
		var mm = flag[1].split(" ");
	} else {
		this.dayCell = _cell.split(" ");
		var mm = new Array("4", "5", "6", "7", "8", "9", "10", "11", "12", "1", "2", "3");
	}
	for (var m in mm) {
		this.mflag[mm[m] - 1] = 1;
	}
	this.label = _lable;
	this.description;
	this.regularFlg = 1;      // 定期回収フラグ（デフォルトはオン:1）
	var result_text = "";
	var today = new Date();
	
	for (var j in this.dayCell) {
		if (this.dayCell[j].length == 1) {
			result_text += "毎週" + this.dayCell[j] + "曜日 ";
		} else if (this.dayCell[j].length == 2 && this.dayCell[j].substr(0,1) != "*") {
			result_text += "第" + this.dayCell[j].charAt(1) + this.dayCell[j].charAt(0) + "曜日 ";
		} else if (this.dayCell[j].length == 2 && this.dayCell[j].substr(0,1) == "*") {
			//
		} else {
			// 不定期回収の場合（YYYYMMDD指定）
			result_text = "不定期 ";
			this.regularFlg = 0;  // 定期回収フラグオフ
		}
	}
	if (monthSplitFlag) {
		var monthList="";
		for (var m in this.mflag) {
			if (this.mflag[m]){
				if (monthList.length>0){
					monthList+=","
				}
				//mを整数化
				monthList+=((m-0)+1)
				}
		};
		monthList+="月 "
		result_text=monthList+result_text
	}
	this.dayLabel = result_text;
	
	this.getDateLabel = function() {
		var result_text = this.mostRecent.getFullYear() + "/" + (1 + this.mostRecent.getMonth()) + "/" + this.mostRecent.getDate();
		return this.getRemark() + this.dayLabel + " " + result_text;
	}
	
	var day_enum = ["日", "月", "火", "水", "木", "金", "土"];
	function getDayIndex(str) {
		for (var i = 0; i < day_enum.length; i++) {
			if (day_enum[i] == str) {
				return i;
			}
		};
		return -1;
	}
	/**
	 * このごみ収集日が特殊な条件を持っている場合備考を返します。収集日データに"*n" が入っている場合に利用されます
	 */
	this.getRemark = function getRemark() {
		var ret = "";
		this.dayCell.forEach(function(day) {
			if (day.substr(0,1) == "*") {
				remarks.forEach(function(remark) {
					if (remark.id == day.substr(1,1)) {
						ret += remark.text + "<br/>";
					}
				});
			};
		});
		return ret;
	}
	/**
	 *このゴミの年間のゴミの日を計算します。
	 *センターが休止期間がある場合は、その期間１週間ずらすという実装を行っております。
	 */
	//MOD START #3 代替日対応
	//this.calcMostRect = function(areaObj) {
	this.calcMostRect = function(areaObj, alternateDays) {
	//MOD E N D #3 代替日対応
		var day_mix = this.dayCell;
		var result_text = "";
		var day_list = new Array();
		// 定期回収の場合
		if (this.regularFlg == 1) {
			var today = new Date();
			//12月 +3月　を表現
			for (var i = 0; i < MaxMonth; i++) {
				var curMonth = today.getMonth() + i;
				var curYear = today.getFullYear() + Math.floor(curMonth / 12);
				var month = (curMonth % 12) + 1;
				// 収集が無い月はスキップ
				if (this.mflag[month - 1] == 0) {
					continue;
				}
				for (var j in day_mix) {
					//休止期間だったら、今後一週間ずらす。
					var isShift = false;
					//week=0が第1週目です。
					for (var week = 0; week < 5; week++) {
						//4月1日を起点として第n曜日などを計算する。
						var date = new Date(curYear, month - 1, 1);
						var d = new Date(date);
						//コンストラクタでやろうとするとうまく行かなかった。。
						//4月1日を基準にして曜日の差分で時間を戻し、最大５週までの増加させて毎週を表現
						d.setTime(date.getTime() + 1000 * 60 * 60 * 24 *
								((7 + getDayIndex(day_mix[j].charAt(0)) - date.getDay()) % 7) + week * 7 * 24 * 60 * 60 * 1000
							);
						//ADD START #3 代替日対応 代替日がある場合、代替日と入れ替える
						if (alternateDays != null) {
							if (alternateDays.hasAlternateDay(areaObj.label, this.label, d)) {
								var alternateDay = alternateDays.find(areaObj.label, this.label, d);
								if(alternateDay == null) {
									//代替日の指定がない場合は、収集しない日とする
									continue;
								} else {
									d = alternateDay;	//代替日と入れ替える
								}
							}
						}
						//ADD E N D #3
						//年末年始のずらしの対応
						//休止期間なら、今後の日程を１週間ずらす
						if (areaObj.isBlankDay(d)) {
							if (WeekShift) {
								isShift = true;
							} else {
								continue;
							}
						}
						if (isShift) {
							d.setTime(d.getTime() + 7 * 24 * 60 * 60 * 1000);
						}
						//同じ月の時のみ処理したい
						if (d.getMonth() != (month - 1) % 12) {
							continue;
						}
						//特定の週のみ処理する
						if (day_mix[j].length > 1) {
							if (week != day_mix[j].charAt(1) - 1) {
								continue;
							}
						}
						day_list.push(d);
					} //for
				} //for
			} //for
		} else {
			// 不定期回収の場合は、そのまま指定された日付をセットす
			for (var j in day_mix) {
				var year = parseInt(day_mix[j].substr(0, 4));
				var month = parseInt(day_mix[j].substr(4, 2)) - 1;
				var day = parseInt(day_mix[j].substr(6, 2));
				var d = new Date(year, month, day);
				day_list.push(d);
			}
		}
		//曜日によっては日付順ではないので最終的にソートする。
		//ソートしなくてもなんとなりそうな気もしますが、とりあえずソート
		day_list.sort(function(a, b) {
			var at = a.getTime();
			var bt = b.getTime();
			if (at < bt) return -1;
			if (at > bt) return 1;
			return 0;
		})
		//直近の日付を更新
		var now = new Date();
		for (var i in day_list) {
			if (this.mostRecent == null && now.getTime() < day_list[i].getTime() + 24 * 60 * 60 * 1000) {
				this.mostRecent = day_list[i];
				break;
			}
		};
		this.dayList = day_list;
	} //this.calcMostRect = function
	/**
	 * 計算したゴミの日一覧をリスト形式として取得します。
	 */
	this.getDayList = function() {
		var day_text = "<ul>";
		for (var i in this.dayList) {
			var d = this.dayList[i];
			day_text += "<li>" + d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate() + "</li>";
		};
		day_text += "</ul>";
		return day_text;
	}
};

/**
センターのデータを管理します。
*/
var CenterModel = function(row) {
	function getDay(center, index) {
		var tmp = center[index].split("/");
		return new Date(tmp[0], tmp[1] - 1, tmp[2]);
	}
	this.name = row[0];
	this.startDate = getDay(row, 1);
	this.endDate = getDay(row, 2);
}

/**
* ゴミのカテゴリを管理するクラスです。
* description.csvのモデルです。
*/
var DescriptionModel = function(data) {
	this.targets = new Array();
	this.label = data[0];
	this.sublabel = data[1];//not used
	this.description = data[2];//not used
	this.styles = data[3];
	this.background = data[4];
}

/**
 * ゴミのカテゴリの中のゴミの具体的なリストを管理するクラスです。
 * target.csvのモデルです。
 */
var TargetRowModel = function(data) {
	this.label = data[0];
	this.name = data[1];
	this.notice = data[2];
	this.furigana = data[3];
}

/**
 * ゴミ収集日に関する備考を管理するクラスです。
 * remarks.csvのモデルです。
 */
var RemarkModel = function(data) {
	this.id = data[0];
	this.text = data[1];
}

/* var windowHeight; */

$(function() {
	/*   windowHeight = $(window).height(); */
	var districtModels = new Array(); // ADD #1 地区を追加
	var center_data = new Array();
	var descriptions = new Array();
	var areaModels = new Array();
	var remarks = new Array();
	var alternateDays = null;	//#3 ADD 代替日対応
	/*   var descriptions = new Array(); */
	//ADD START #1 地区を追加
	function getSelectedAreaMasterName() {
		return localStorage.getItem("selected_area_master_name");
	}
	function setSelectedAreaMasterName(name) {
		try {
			localStorage.setItem("selected_area_master_name", name);
		} catch (domException) {
		}
	}
	//ADD E N D #1 地区を追加
	//ADD START #5
	function getSelectedAreaMasterNameBefore() {
		return localStorage.getItem("selected_area_master_name_before");
	}
	function setSelectedAreaMasterNameBefore(name) {
		try {
			localStorage.setItem("selected_area_master_name_before", name);
		} catch (domException) {
		}
	}
	//ADD E N D #5
	function getSelectedAreaName() {
		return localStorage.getItem("selected_area_name");
	}
	function setSelectedAreaName(name) {
		try {
			localStorage.setItem("selected_area_name", name);
		} catch (domException) {
		}
	}
	function csvToArray(filename, cb) {
		$.get(filename, function(csvdata) {
			//CSVのパース作業
			//CRの解析ミスがあった箇所を修正しました。
			//以前のコードだとCRが残ったままになります。
			// var csvdata = csvdata.replace("\r/gm", ""),
			csvdata = csvdata.replace(/\r/gm, "");
			var line = csvdata.split("\n"),
			ret = [];
			//ADD START #12 CSVパースライブラリの導入
			var opt = {
					quotes: false,
					delimiter: ",",
					newline: "\r\n"
			};
			//ADD E N D #12
			for (var i in line) {
				//空行はスルーする。
				if (line[i].length == 0) continue;
				//MOD START #12 CSVパースライブラリの導入
				var csv = new CSV(line[i], opt).parse();
				//var row = line[i].split(",");
				ret.push(csv[0]);
				//MOD E N D #12
				ret.push(row);
			}
			cb(ret);
		});
	}

	//ADD START #1 地区を追加
	function updateDistrictList(){
		csvToArray("data/district.csv", function(tmp) {
			var district_label = tmp.shift();
			for (var i in tmp) {
				var row = tmp[i];
				var districtModel = new DistrictModel();
				districtModel.district = row[0];
				districtModels.push(districtModel);
			}
			//エリアとゴミ処理センターを対応後に、表示のリストを生成する。
			//ListメニューのHTML作成
			var selected_name = getSelectedAreaMasterName();
			var area_select_form = $("#select_area_master");
			var select_html = "";
			select_html += '<option value="-1">地区を選択してください</option>';
			for (var row_index in districtModels) {
				var area_name = districtModels[row_index].district;
				var selected = (selected_name == area_name) ? 'selected="selected"' : "";
				select_html += '<option value="' + row_index + '" ' + selected + " >" + area_name + "</option>";
			}
			//HTMLへの適応
			area_select_form.html(select_html);
			area_select_form.change();
		}) //csvToArray
	} //function
	//ADD E N D #1

	//MOD START #1 地区を追加
	function updateAreaList(district) {
		csvToArray("data/area_days.csv", function(tmp) {
			var area_days_label = tmp.shift();
			for (var i in tmp) {
				var row = tmp[i];
				var area = new AreaModel();
				area.distrcit = row[0]; //地区
				area.label = row[1];
				area.centerName = row[2];
				if(district != area.distrcit){
					continue;
				}
				areaModels.push(area);
				//3列目以降の処理
				for (var r = 3; r < 3 + MaxDescription; r++) {
					//MOD START #2 row[r]収集日が未指定の場合は追加しない
//					if (area_days_label[r]) {
					if (area_days_label[r] && row[r]) {
					//MOD E N D #2
						var trash = new TrashModel(area_days_label[r], row[r], remarks);
						area.trash.push(trash);
					}
				} //for
			} //for
			csvToArray("data/center.csv", function(tmp) {
				//ゴミ処理センターのデータを解析します。
				//表示上は現れませんが、
				//金沢などの各処理センターの休止期間分は一週間ずらすという法則性のため
				//例えば第一金曜日のときは、一周ずらしその月だけ第二金曜日にする
				tmp.shift();
				for (var i in tmp) {
					var row = tmp[i];
					var center = new CenterModel(row);
					center_data.push(center);
				}
				//ゴミ処理センターを対応する各地域に割り当てます。
				for (var i in areaModels) {
					var area = areaModels[i];
					area.setCenter(center_data);
				};
				//エリアとゴミ処理センターを対応後に、表示のリストを生成する。
				//ListメニューのHTML作成
				var selected_name = getSelectedAreaName();
				var area_select_form = $("#select_area");
				var select_html = "";
				select_html += '<option value="-1">地域を選択してください</option>';
				for (var row_index in areaModels) {
					var area_name = areaModels[row_index].label;
					var selected = (selected_name == area_name) ? 'selected="selected"' : "";
					select_html += '<option value="' + row_index + '" ' + selected + " >" + area_name + "</option>";
				}
				//デバッグ用
				if (typeof dump == "function") {
					dump(areaModels);
				}
				//HTMLへの適応
				area_select_form.html(select_html);
				area_select_form.change();
			}); //csvToArray
		}); //csvToArray
		//ADD START #3 代替日リストを生成する
		csvToArray("data/alternate_days.csv", function(tmp) {
			var alternate_days_label = tmp.shift();
			alternateDays = new AlternateDaysModel(district);
			for (var i in tmp) {
				var row = tmp[i];
				if(row[0] != alternateDays.district) {
					continue;//地区が一致するもののみ
				}
				alternateDays.push(row[1], row[2], row[3], row[4]);
			}
		});//csvToArray
		//ADD E N D #3
	}
	
  /*
  function updateAreaList() {
    csvToArray("data/area_days.csv", function(tmp) {
      var area_days_label = tmp.shift();
      for (var i in tmp) {
        var row = tmp[i];
        var area = new AreaModel();
        area.label = row[0];
        area.centerName = row[1];

        areaModels.push(area);
        //２列目以降の処理
        for (var r = 2; r < 2 + MaxDescription; r++) {
          if (area_days_label[r]) {
            var trash = new TrashModel(area_days_label[r], row[r], remarks);
            area.trash.push(trash);
          }
        }
      }

      csvToArray("data/center.csv", function(tmp) {
        //ゴミ処理センターのデータを解析します。
        //表示上は現れませんが、
        //金沢などの各処理センターの休止期間分は一週間ずらすという法則性のため
        //例えば第一金曜日のときは、一周ずらしその月だけ第二金曜日にする
        tmp.shift();
        for (var i in tmp) {
          var row = tmp[i];

          var center = new CenterModel(row);
          center_data.push(center);
        }
        //ゴミ処理センターを対応する各地域に割り当てます。
        for (var i in areaModels) {
          var area = areaModels[i];
          area.setCenter(center_data);
        };
        //エリアとゴミ処理センターを対応後に、表示のリストを生成する。
        //ListメニューのHTML作成
        var selected_name = getSelectedAreaName();
        var area_select_form = $("#select_area");
        var select_html = "";
        select_html += '<option value="-1">地域を選択してください</option>';
        for (var row_index in areaModels) {
          var area_name = areaModels[row_index].label;
          var selected = (selected_name == area_name) ? 'selected="selected"' : "";

          select_html += '<option value="' + row_index + '" ' + selected + " >" + area_name + "</option>";
        }

        //デバッグ用
        if (typeof dump == "function") {
          dump(areaModels);
        }
        //HTMLへの適応
        area_select_form.html(select_html);
        area_select_form.change();
      });
    });
  }
   */
//MOD  E N D #1
	function createMenuList(after_action) {
		// 備考データを読み込む
		csvToArray("data/remarks.csv", function(data) {
			data.shift();
			for (var i in data) {
				remarks.push(new RemarkModel(data[i]));
			}
		});
		csvToArray("data/description.csv", function(data) {
			data.shift();
			for (var i in data) {
				descriptions.push(new DescriptionModel(data[i]));
			}
			csvToArray("data/target.csv", function(data) {
				data.shift();
				for (var i in data) {
					var row = new TargetRowModel(data[i]);
					for (var j = 0; j < descriptions.length; j++) {
						//一致してるものに追加する。
						if (descriptions[j].label == row.label) {
							descriptions[j].targets.push(row);
							break;
						}
					};
				}
				after_action();
				$("#accordion2").show();
			});
		});
	}

	function updateData(row_index) {
		//SVG が使えるかどうかの判定を行う。
		//TODO Android 2.3以下では見れない（代替の表示も含め）不具合が改善されてない。。
		//参考 http://satussy.blogspot.jp/2011/12/javascript-svg.html
		var ableSVG = (window.SVGAngle !== void 0);
		//var ableSVG = false;  // SVG未使用の場合、descriptionの1項目目を使用
		var areaModel = areaModels[row_index];
		var today = new Date();
		//直近の一番近い日付を計算します。
		//MOD START #3 代替日対応
		//areaModel.calcMostRect();
		areaModel.calcMostRect(alternateDays);
		//MOD E N D#3 代替日対応
		//トラッシュの近い順にソートします。
		areaModel.sortTrash();
		//MOD START #6 自動レイアウト調整が表示しないゴミの種類を含んで計算される問題を修正
		//var accordion_height = $(window).height() / descriptions.length;
		var accordion_height = $(window).height() / areaModel.trash.length;
//		if(descriptions.length>4) {
		if(areaModel.trash.length>4) {
			accordion_height = accordion_height / 4.1;
//			if (accordion_height>140) {accordion_height = accordion_height / descriptions.length;};
			if (accordion_height>140) {accordion_height = accordion_height / areaModel.trash.length;};
			if (accordion_height<130) {accordion_height=130;};
		}
		//MOD E N D #6
		var styleHTML = "";
		var accordionHTML = "";
		//アコーディオンの分類から対応の計算を行います。
		for (var i in areaModel.trash) {
			var trash = areaModel.trash[i];
			for (var d_no in descriptions) {
				var description = descriptions[d_no];
				if (description.label != trash.label) {
					continue;
				}
				var target_tag = "";
				var furigana = "";
				var target_tag = "";
				var targets = description.targets;
				for (var j in targets) {
					var target = targets[j];
					if (furigana != target.furigana) {
						if (furigana != "") {
							target_tag += "</ul>";
						}
						furigana = target.furigana;
						target_tag += '<h4 class="initials">' + furigana + "</h4>";
						target_tag += "<ul>";
					}
					target_tag += '<li style="list-style:none;">' + target.name + "</li>";
					target_tag += '<p class="note">' + target.notice + "</p>";
				}
				target_tag += "</ul>";
				var dateLabel = trash.getDateLabel();
				//あと何日かを計算する処理です。
				var leftDay = Math.ceil((trash.mostRecent.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
				var leftDayText = "";
				if (leftDay == 0) {
					leftDayText = "今日";
				} else if (leftDay == 1) {
					leftDayText = "明日";
				} else if (leftDay == 2) {
					leftDayText = "明後日"
				} else {
					leftDayText = leftDay + "日後";
				}
				styleHTML += '#accordion-group' + d_no + '{background-color:  ' + description.background + ';} ';
				accordionHTML +=
					'<div class="accordion-group" id="accordion-group' + d_no + '">' +
					'<div class="accordion-heading">' +
					'<a class="accordion-toggle" style="height:' + accordion_height + 'px" data-toggle="collapse" data-parent="#accordion" href="#collapse' + i + '">' +
					'<div class="left-day">' + leftDayText + '</div>' +
					'<div class="accordion-table" >';
				if (ableSVG && SVGLabel) {
					//MOD START #2 アコーディオンパネルに表示する文字をsublabelに変更する
					//accordionHTML += '<img src="' + description.styles + '" alt="' + description.label + '"  />';
					if (description.sublabel) {
						accordionHTML += '<img src="' + description.styles + '" alt="' + description.sublabel + '"  />';
					} else {
						accordionHTML += '<img src="' + description.styles + '" alt="' + description.label + '"  />';
					}
					//MOD E N D #2
				} else {
					//MOD START #2 アコーディオンパネルに表示する文字をsublabelに変更する					
					//accordionHTML += '<p class="text-center">' + description.label + "</p>";
					if (description.sublabel) {
						accordionHTML += '<p class="text-center">' + description.sublabel + "</p>";
					} else {
						accordionHTML += '<p class="text-center">' + description.label + "</p>";						
					}
					//MOD E N D #2
				}
				accordionHTML += "</div>" +
				'<h6><p class="text-left date">' + dateLabel + "</p></h6>" +
				"</a>" +
				"</div>" +
				'<div id="collapse' + i + '" class="accordion-body collapse">' +
				'<div class="accordion-inner">' +
				description.description + "<br />" + target_tag +
				'<div class="targetDays"></div></div>' +
				"</div>" +
				"</div>";
			}
		} //for

		$("#accordion-style").html('<!-- ' + styleHTML + ' -->');
		
		var accordion_elm = $("#accordion");
		accordion_elm.html(accordionHTML);
		
		$('html,body').animate({scrollTop: 0}, 'fast');
		//アコーディオンのラベル部分をクリックしたら
		$(".accordion-body").on("shown.bs.collapse", function() {
			var body = $('body');
			var accordion_offset = $($(this).parent().get(0)).offset().top;
			body.animate({
				scrollTop: accordion_offset
			}, 50);
		});
		//アコーディオンの非表示部分をクリックしたら
		$(".accordion-body").on("hidden.bs.collapse", function() {
			if ($(".in").length == 0) {
				$("html, body").scrollTop(0);
			}
		});
	}
	
	function onChangeSelect(row_index) {
		if (row_index == -1) {
			$("#accordion").html("");
			setSelectedAreaName("");
			return;
		}
		setSelectedAreaName(areaModels[row_index].label);
		if ($("#accordion").children().length === 0 && descriptions.length === 0) {
			createMenuList(function() {
				updateData(row_index);
			});
		} else {
			updateData(row_index);
		}
	}

	function getAreaIndex(area_name) {
		for (var i in areaModels) {
			if (areaModels[i].label == area_name) {
				return i;
			}
		}
		return -1;
	}

	// ADD START #1 地区を追加
	//地区の変更時
	function onChangeSelectMaster(row_index) {
		if (row_index == -1) {
			// 初期化
			$("#accordion").html("");
			$("#select_area").html('<option value="-1">地域を選択してください</option>');
			setSelectedAreaMasterName("");
			setSelectedAreaName("");
			return;
		}
		//ADD START #5
		var checkAreaMasterName = getSelectedAreaMasterName();
		var checkAreaMasterNameBefore = getSelectedAreaMasterNameBefore();
		if(checkAreaMasterName == checkAreaMasterNameBefore) {
		} else {
			$("#accordion").html("");
			$("#select_area").html('<option value="-1">地域を選択してください</option>');
			setSelectedAreaName("");
		}
		//ADD E N D #5
		areaModels.length = 0;
		
		//ADD START #5
		setSelectedAreaMasterName(districtModels[row_index].district);
		setSelectedAreaMasterNameBefore(districtModels[row_index].district);
		//ADD E N D #5
		
		updateAreaList(districtModels[row_index].district);
	}
	// リストマスターが選択されたら
	$("#select_area_master").change(function(data) {
		var row_index = $(data.target).val();
		onChangeSelectMaster(row_index);
	});
	// ADD E N D #1
	
	//リストが選択されたら
	$("#select_area").change(function(data) {
		var row_index = $(data.target).val();
		onChangeSelect(row_index);
	});

	//-----------------------------------
	//位置情報をもとに地域を自動的に設定する処理です。
	//これから下は現在、利用されておりません。
	//将来的に使うかもしれないので残してあります。
	$("#gps_area").click(function() {
		navigator.geolocation.getCurrentPosition(function(position) {
			$.getJSON("area_candidate.php", {
				latitude: position.coords.latitude,
				longitude: position.coords.longitude
			}, function(data) {
				if (data.result == true) {
					var area_name = data.candidate;
					var index = getAreaIndex(area_name);
					$("#select_area").val(index).change();
					alert(area_name + "が設定されました");
				} else {
					alert(data.reason);
				}
			})
		}, function(error) {
			alert(getGpsErrorMessage(error));
		});
	});

	if (getSelectedAreaName() == null) {
		$("#accordion2").show();
		$("#collapseZero").addClass("in");
	}
	if (!navigator.geolocation) {
		$("#gps_area").css("display", "none");
	}

	function getGpsErrorMessage(error) {
		switch (error.code) {
		case error.PERMISSION_DENIED:
			return "User denied the request for Geolocation."
		case error.POSITION_UNAVAILABLE:
			return "Location information is unavailable."
		case error.TIMEOUT:
			return "The request to get user location timed out."
		case error.UNKNOWN_ERROR:
		default:
			return "An unknown error occurred."
		}
	}
	updateDistrictList(); // MOD #1 地区を追加
	//updateAreaList();
});
