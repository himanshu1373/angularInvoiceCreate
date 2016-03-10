angular.module('invoiceApp', [])
.controller('InvoiceCtrl', ['$scope',function ($scope) {
  $scope.globalModel = {
    'companyName': 'Interactive Dev ltd',
    'comapnyAddress': [
      'Richard Bangay',
      'Address line 1',
      'Address line 2',
      'Address line 3',
      'Address line 4',
      'Address line 5'
    ],
    'bankName': 'bank name',
    'accountName': 'account name',
    'accountNumber': 'xxxxxxxx',
    'accountsortCode': 'xx-xx-xx',
    'vatCharged': false
  };
  $scope.model = {
    'purchaseOrderId': 1234,
    'invoiceNumber': 1,
    'nameAndEmail': 'John Doe, john.doe@yo.com',
    'invoiceDate': '04/01/16',
    'invoiceDescription': 'Example work I did for such and such',
    'workBreakDown': [
      {
        'date': '01/01/16',
        'timeWorkedInHours': '8',
        'dayRate': '550'
      },
      {
        'date': '02/01/16',
        'timeWorkedInHours': '7.5',
        'dayRate': '600'
      },
      {
        'date': '03/01/16',
        'timeWorkedInHours': '8',
        'dayRate': '550'
      }
    ]
  };
  
  $scope.getTotalAmountDue = function () {
    var total = 0, a , workBreakDownLength = $scope.model.workBreakDown.length;
    for (a = 0; a < workBreakDownLength; a++) {
      var workBreakDownItem = $scope.model.workBreakDown[a];
      total += ((Number(workBreakDownItem.dayRate) / 8) * Number(workBreakDownItem.timeWorkedInHours));
    }
    return ($scope.globalModel.vatCharged) ? (total + (total * 0.2)) : total;
  }

  $scope.getTotalHours = function () {
    var total = 0, a , workBreakDownLength = $scope.model.workBreakDown.length;
    for (a = 0; a < workBreakDownLength; a++) {
      var workBreakDownItem = $scope.model.workBreakDown[a];
      total += Number(workBreakDownItem.timeWorkedInHours);
    }
    return total;
  }

  $scope.getVatDue = function () {
    if ($scope.globalModel.vatCharged) {
      var total = 0, a , workBreakDownLength = $scope.model.workBreakDown.length;
      for (a = 0; a < workBreakDownLength; a++) {
        var workBreakDownItem = $scope.model.workBreakDown[a];
        total += ((Number(workBreakDownItem.dayRate) / 8) * Number(workBreakDownItem.timeWorkedInHours));
      }
      return total * 0.2;
    }
    return 0;
  }

}]);



