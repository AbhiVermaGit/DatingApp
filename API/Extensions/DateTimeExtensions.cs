using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.Extensions
{
    public static class DateTimeExtensions
    {
        public static int CalculateAge(this DateTime dob){

            var today = DateTime.Today;
            var age = today.Year - dob.Year;

            if(dob.Date > today.AddYears(-age)) age--;   ///logic of age years -1 years if not yet birth date.
            return age;
        }
    }
}