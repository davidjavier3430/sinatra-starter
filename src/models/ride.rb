class Ride < ActiveRecord::Base

 validates :nickname, :telephone , :email, presence: true
 validates :email    , format:  { with: /[a-z]+@[a-z]+/i, message: "Please Provide A Valid Email" }
 validates :telephone , length: { minimum: 7, message: "Please Provide A Valid Telephone" }

end
