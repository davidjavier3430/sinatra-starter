#Setup environment
require 'bundler/setup'
require 'dotenv'
Dotenv.load

#Require Dependencies
require "json"
require "sinatra/base"
require "sinatra/activerecord"
require "sinatra/flash"
require "sinatra/content_for"
require "will_paginate"
require 'will_paginate/active_record'
require 'alchemist'
Alchemist.setup

#Require Helpers
Dir[File.dirname(__FILE__) + '/helpers/*.rb'].each {|file| require file }

#Require Models
Dir[File.dirname(__FILE__) + '/models/*.rb'].each {|file| require file }

#Require Routes
Dir[File.dirname(__FILE__) + '/routes/*.rb'].each {|file| require file }


class MyApplication < Sinatra::Base

  #Configure Sinatra
  set :root,      File.dirname(__FILE__)
  set :sessions,  true

  register WillPaginate::Sinatra
  helpers Sinatra::ContentFor
  helpers EscapeHTML

  #Configure Development
  configure :development do
    require 'pry'
  end

end
